from pydantic import BaseModel
from datetime import datetime

class SensorDataCreate(BaseModel):
    device_id: str
    power: float
    voltage: float
    current: float

class SensorDataResponse(SensorDataCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    device_id: str
    severity: str
    alert_type: str
    title: str
    description: str
    value: float
    timestamp: datetime
    class Config:
        from_attributes = True
