from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from .database import SessionLocal, engine, Base
from .models import SensorData, Alert
from .schemas import SensorDataCreate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IoT Energy Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://iot-energy-monitoring-system.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Thresholds ───────────────────────────────────────────────────────────────
THRESHOLDS = {
    "power":   {"warning": 50,  "critical": 80},
    "voltage": {"warning": 210, "critical": 200},   # drop below = alert
    "current": {"warning": 0.3, "critical": 0.5},
}

def detect_alerts(record: SensorData) -> list[Alert]:
    """Return a list of Alert objects for any threshold breaches."""
    alerts = []

    # High power
    if record.power >= THRESHOLDS["power"]["critical"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="critical",
            alert_type="high_power",
            title="Critical power spike",
            description=f"{record.device_id} reported {record.power}W — exceeds critical threshold ({THRESHOLDS['power']['critical']}W)",
            value=record.power,
        ))
    elif record.power >= THRESHOLDS["power"]["warning"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="warning",
            alert_type="high_power",
            title="High power consumption",
            description=f"{record.device_id} reported {record.power}W — exceeds warning threshold ({THRESHOLDS['power']['warning']}W)",
            value=record.power,
        ))

    # Low voltage (drop = danger)
    if record.voltage <= THRESHOLDS["voltage"]["critical"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="critical",
            alert_type="voltage_drop",
            title="Critical voltage drop",
            description=f"{record.device_id} reported {record.voltage}V — below critical threshold ({THRESHOLDS['voltage']['critical']}V)",
            value=record.voltage,
        ))
    elif record.voltage <= THRESHOLDS["voltage"]["warning"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="warning",
            alert_type="voltage_drop",
            title="Voltage drop detected",
            description=f"{record.device_id} reported {record.voltage}V — below warning threshold ({THRESHOLDS['voltage']['warning']}V)",
            value=record.voltage,
        ))

    # High current
    if record.current >= THRESHOLDS["current"]["critical"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="critical",
            alert_type="high_current",
            title="Critical current detected",
            description=f"{record.device_id} reported {record.current}A — exceeds critical threshold ({THRESHOLDS['current']['critical']}A)",
            value=record.current,
        ))
    elif record.current >= THRESHOLDS["current"]["warning"]:
        alerts.append(Alert(
            device_id=record.device_id, severity="warning",
            alert_type="high_current",
            title="High current warning",
            description=f"{record.device_id} reported {record.current}A — exceeds warning threshold ({THRESHOLDS['current']['warning']}A)",
            value=record.current,
        ))

    return alerts


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "IoT Energy Analytics Platform"}


# ── Write sensor reading + auto-generate alerts ───────────────────────────────
@app.post("/sensor-data", status_code=201)
def create_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):
    record = SensorData(
        device_id=data.device_id,
        power=data.power,
        voltage=data.voltage,
        current=data.current,
    )
    db.add(record)
    db.flush()  # get record.id before commit

    # Auto-detect and save alerts
    for alert in detect_alerts(record):
        db.add(alert)

    db.commit()
    db.refresh(record)
    return record


# ── Read sensor data ──────────────────────────────────────────────────────────
@app.get("/sensor-data")
def get_sensor_data(
    device_id: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(SensorData)
    if device_id:
        q = q.filter(SensorData.device_id == device_id)
    return q.order_by(SensorData.id.desc()).limit(limit).all()


# ── Alerts ────────────────────────────────────────────────────────────────────
@app.get("/alerts")
def get_alerts(
    severity: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Alert)
    if severity:
        q = q.filter(Alert.severity == severity)
    return q.order_by(Alert.id.desc()).limit(limit).all()


# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/stats")
def stats(db: Session = Depends(get_db)):
    records = db.query(SensorData).all()
    alerts  = db.query(Alert).all()

    device_ids  = list(set(r.device_id for r in records))
    total_power = sum(r.power for r in records)
    avg_voltage = sum(r.voltage for r in records) / len(records) if records else 0
    avg_current = sum(r.current for r in records) / len(records) if records else 0

    return {
        "total_devices":    len(device_ids),
        "total_readings":   len(records),
        "total_power_w":    round(total_power, 2),
        "avg_voltage_v":    round(avg_voltage, 2),
        "avg_current_a":    round(avg_current, 3),
        "devices":          device_ids,
        # alert summary for the dashboard cards
        "alerts_critical":  sum(1 for a in alerts if a.severity == "critical"),
        "alerts_warning":   sum(1 for a in alerts if a.severity == "warning"),
        "alerts_total":     len(alerts),
        "high_power_count": sum(1 for a in alerts if a.alert_type == "high_power"),
        "voltage_drop_count": sum(1 for a in alerts if a.alert_type == "voltage_drop"),
        "high_current_count": sum(1 for a in alerts if a.alert_type == "high_current"),
    }


# ── Devices ───────────────────────────────────────────────────────────────────
@app.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    records = db.query(SensorData).all()
    latest: dict[str, SensorData] = {}
    for r in records:
        if r.device_id not in latest or r.id > latest[r.device_id].id:
            latest[r.device_id] = r
    return [
        {
            "device_id":        dev_id,
            "latest_power_w":   r.power,
            "latest_voltage_v": r.voltage,
            "latest_current_a": r.current,
            "last_seen_id":     r.id,
        }
        for dev_id, r in latest.items()
    ]


# ── Metrics ───────────────────────────────────────────────────────────────────
@app.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    records = db.query(SensorData).all()
    if not records:
        return {"total_devices": 0, "total_power_w": 0, "per_device": []}

    grouped: dict[str, list] = {}
    for r in records:
        grouped.setdefault(r.device_id, []).append(r)

    per_device = []
    for device_id, readings in grouped.items():
        powers = [r.power for r in readings]
        per_device.append({
            "device_id":      device_id,
            "reading_count":  len(readings),
            "total_power_w":  round(sum(powers), 2),
            "avg_power_w":    round(sum(powers) / len(powers), 2),
            "max_power_w":    round(max(powers), 2),
            "min_power_w":    round(min(powers), 2),
            "avg_voltage_v":  round(sum(r.voltage for r in readings) / len(readings), 2),
            "avg_current_a":  round(sum(r.current for r in readings) / len(readings), 3),
        })

    return {
        "total_devices":  len(grouped),
        "total_power_w":  round(sum(r.power for r in records), 2),
        "per_device":     sorted(per_device, key=lambda x: x["total_power_w"], reverse=True),
    }


# ── Device history ────────────────────────────────────────────────────────────
@app.get("/devices/{device_id}")
def device_history(device_id: str, limit: int = Query(50, le=500), db: Session = Depends(get_db)):
    from fastapi import HTTPException
    records = (
        db.query(SensorData)
        .filter(SensorData.device_id == device_id)
        .order_by(SensorData.id.desc())
        .limit(limit)
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail=f"No data for device '{device_id}'")
    return records
