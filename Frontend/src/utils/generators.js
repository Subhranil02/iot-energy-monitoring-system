export function generateReading(device, tick) {
  if (device.type === "temperature") {
    if (device.id === "temp-02" && tick > 8) {
      return {
        value: +(38 + Math.random() * 6).toFixed(1),
        unit: "°C",
        status: "critical",
      };
    }

    return {
      value: +(21 + Math.random() * 4).toFixed(1),
      unit: "°C",
      status: "normal",
    };
  }

  if (device.type === "door") {
    const replay = tick > 5 && Math.random() > 0.6;

    return {
      value: replay
        ? "Replay ×" + (Math.floor(Math.random() * 3) + 2)
        : "Closed",
      unit: "",
      status: replay ? "warning" : "normal",
    };
  }

  if (device.type === "motion") {
    return {
      value: "No motion",
      unit: "",
      status: "normal",
    };
  }

  if (device.type === "unknown") {
    return {
      value: "—",
      unit: "",
      status: "critical",
    };
  }

  return {
    value: "—",
    unit: "",
    status: "normal",
  };
}

export function generateAlert(device, reading) {
  if (
    device.type === "temperature" &&
    device.id === "temp-02" &&
    reading.status === "critical"
  ) {
    return {
      id: Date.now() + Math.random(),
      severity: "critical",
      title: "High temperature detected",
      desc: `Sensor #2 reported ${reading.value}°C — threshold exceeded (38°C)`,
      time: new Date(),
    };
  }

  if (device.type === "unknown") {
    return {
      id: Date.now() + Math.random(),
      severity: "critical",
      title: "Unauthorized device",
      desc: "Unknown device ID publishing to home/sensor/unknown",
      time: new Date(),
    };
  }

  if (device.type === "door" && reading.status === "warning") {
    return {
      id: Date.now() + Math.random(),
      severity: "warning",
      title: "Replay attack suspected",
      desc: `Door sensor sent identical payload ${
        reading.value.split("×")[1]
      } times in 3 seconds`,
      time: new Date(),
    };
  }

  return null;
}