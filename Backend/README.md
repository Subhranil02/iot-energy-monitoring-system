# 🔐 IoT Security Dashboard

An IoT Security Monitoring Dashboard built using **React**, **FastAPI**, **SQLAlchemy**, and **MQTT**. The platform provides real-time monitoring of IoT devices, security alerts, system health, and sensor analytics through an interactive web dashboard.

---

## 🚀 Features

### Frontend (React)

- Modern IoT Security Dashboard UI
- Device Monitoring Panel
- Security Alerts Panel
- System Overview Dashboard
- Real-time Statistics Cards
- Responsive Layout
- API Integration with FastAPI

### Backend (FastAPI)

- REST API for Sensor Data
- Device Metrics Endpoints
- SQLAlchemy ORM Integration
- SQLite Database Support
- Swagger API Documentation
- Data Storage and Retrieval

### Security Monitoring

- Critical Alert Detection
- Threat Tracking
- Device Status Monitoring
- MQTT Communication Monitoring

---

## 🛠️ Tech Stack

### Frontend

- React.js
- JavaScript (ES6+)
- CSS3
- Recharts

### Backend

- FastAPI
- Python
- SQLAlchemy
- SQLite
- Uvicorn

### IoT

- MQTT Protocol
- Sensor Data Simulation

---

## 📂 Project Structure

```text
iot-dashboard/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── data/
│   │   ├── utils/
│   │   └── App.js
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   └── venv/
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/iot-security-dashboard.git
cd iot-security-dashboard
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Application will run at:

```text
http://localhost:3000
```

---

## Backend Setup

Create Virtual Environment:

```bash
python -m venv venv
```

Activate Environment:

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

Install Dependencies:

```bash
pip install fastapi uvicorn sqlalchemy
```

Run FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## API Endpoints

### Home

```http
GET /
```

### Create Sensor Data

```http
POST /sensor-data
```

### Get Sensor Data

```http
GET /sensor-data
```

### System Metrics

```http
GET /metrics
```

---

## Dashboard Preview

### Overview Tab

- MQTT Broker Status
- API Status
- Database Status
- Last Update Time

### Devices Tab

- Device List
- Device Status
- MQTT Topics

### Alerts Tab

- High Temperature Alerts
- Unauthorized Access Alerts
- Security Event Tracking

---

## Future Enhancements

- MQTT Broker Integration
- Real-Time WebSocket Updates
- JWT Authentication
- User Roles & Permissions
- Docker Deployment
- PostgreSQL Migration
- AI-Based Threat Detection
- Device Management Module

---

## Learning Objectives

This project demonstrates:

- Full Stack Development
- React Frontend Design
- FastAPI Backend Development
- SQLAlchemy ORM Usage
- REST API Design
- IoT Monitoring Concepts
- Security Dashboard Development

---

## Author

**Subhranil Ghosh**

B.Tech Student | IoT & Cybersecurity Enthusiast

---

## License

This project is developed for educational and learning purposes.
