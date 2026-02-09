# Agro Monitor Backend - Documentation

This directory contains comprehensive documentation for the Agro Monitor sensor WebSocket API.

## 📚 Available Documentation

### 1. [Sensor Implementation Guide](sensor_implementation.md)
Complete walkthrough of the RGB water color sensor implementation, including:
- Code changes and architecture
- Testing results
- Usage examples
- Technical specifications

### 2. [Flutter Integration Guide](flutter_integration.md)
Step-by-step guide for integrating sensors into Flutter applications:
- Data models (numeric and RGB sensors)
- WebSocket service implementation
- Widget examples with UI code
- Complete dashboard example

### 3. [Postman Testing Guide](postman_testing.md)
Guide for testing the WebSocket API using Postman:
- Connection setup
- Sample payloads for all sensors
- Testing scenarios
- Troubleshooting tips

---

## 🌐 API Overview

### WebSocket Endpoint
```
ws://localhost:3000
```

### Available Sensors

| Sensor ID | Type | Unit | Update Interval | Description |
|-----------|------|------|-----------------|-------------|
| `TEMP_01` | Numeric | °C | 2 seconds | Water Temperature |
| `PH_01` | Numeric | pH | 2 seconds | pH Level |
| `TURB_01` | Numeric | NTU | 5 seconds | Turbidity |
| `DO_01` | Numeric | mg/L | 5 seconds | Dissolved Oxygen |
| `SAL_01` | Numeric | ppt | 5 seconds | Salinity |
| `WCOLOR` | RGB | RGB | 5 seconds | Water Color |

---

## 🚀 Quick Start

### Testing with Postman
1. Open Postman Desktop
2. Create new WebSocket request
3. Connect to `ws://localhost:3000`
4. Watch sensor data stream in

### Integrating with Flutter
```dart
final service = SensorWebSocketService();
service.connect('http://YOUR_SERVER_IP:3000');

// Listen to sensors
service.tempStream.listen((data) {
  print('Temperature: ${data.value} ${data.unit}');
});
```

---

## 📖 Data Formats

### Numeric Sensor Payload
```json
{
  "sensorId": "TEMP_01",
  "value": 25.34,
  "unit": "°C",
  "limits": {
    "absoluteMin": 0,
    "absoluteMax": 60,
    "minSafe": 22,
    "maxSafe": 32
  },
  "timestamp": "2026-02-09T16:13:45.123Z"
}
```

### RGB Sensor Payload (WCOLOR)
```json
{
  "sensorId": "WCOLOR",
  "value": {
    "r": 183,
    "g": 209,
    "b": 230
  },
  "unit": "RGB",
  "limits": {
    "absoluteMin": { "r": 0, "g": 0, "b": 0 },
    "absoluteMax": { "r": 255, "g": 255, "b": 255 },
    "minSafe": { "r": 150, "g": 180, "b": 200 },
    "maxSafe": { "r": 220, "g": 230, "b": 255 }
  },
  "timestamp": "2026-02-09T16:13:50.456Z"
}
```

---

## 🛠️ Development

### Running the Server
```bash
npm run start:dev
```

### Running Tests
```bash
npm test
```

---

For detailed information, please refer to the individual documentation files listed above.
