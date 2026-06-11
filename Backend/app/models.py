from sqlalchemy import Column, Integer, String, Float, DateTime
from .database import Base
from datetime import datetime

class SensorData(Base):
    __tablename__ = "sensor_data"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, index=True)
    power      = Column(Float)
    voltage    = Column(Float)
    current    = Column(Float)
    timestamp  = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id          = Column(Integer, primary_key=True, index=True)
    device_id   = Column(String, index=True)
    severity    = Column(String)   # "critical" | "warning" | "info"
    alert_type  = Column(String)   # "high_power" | "voltage_drop" | "high_current"
    title       = Column(String)
    description = Column(String)
    value       = Column(Float)
    timestamp   = Column(DateTime, default=datetime.utcnow)
