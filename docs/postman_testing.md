# Postman Testing Guide - Agro Monitor Sensors

Complete guide for testing the Agro Monitor sensor WebSocket API using Postman.

## Prerequisites

- **Postman Desktop App** (WebSocket support requires desktop version, not web)
- **Server Running**: Ensure your NestJS server is running (`npm run start:dev`)

---

## WebSocket Connection Setup

### 1. Create New WebSocket Request

1. Open Postman
2. Click **New** → **WebSocket Request**
3. Enter URL: `ws://localhost:3000`
4. Click **Connect**

### 2. Connection Status

Once connected, you should see:
```
Connected to ws://localhost:3000
```

---

## Listening to Sensor Events

### Event Names

The server broadcasts data on these event channels:

| Event Name | Sensor | Frequency |
|------------|--------|-----------|
| `TEMP_01` | Temperature | Every 2 seconds |
| `PH_01` | pH Level | Every 2 seconds |
| `TURB_01` | Turbidity | Every 5 seconds |
| `DO_01` | Dissolved Oxygen | Every 5 seconds |
| `SAL_01` | Salinity | Every 5 seconds |
| `WCOLOR` | Water Color (RGB) | Every 5 seconds |

### How to Listen

In Postman WebSocket interface:
1. After connecting, messages will automatically appear in the **Messages** panel
2. Each message shows the event name and payload
3. Use the filter to search for specific events (e.g., `WCOLOR`)

---

## Sample Payloads

### 1. Temperature (TEMP_01)

```json
{
  "sensorId": "TEMP_01",
  "name": "Temperature",
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

### 2. pH Level (PH_01)

```json
{
  "sensorId": "PH_01",
  "value": 7.12,
  "unit": "pH",
  "limits": {
    "absoluteMin": 0,
    "absoluteMax": 14,
    "minSafe": 6.5,
    "maxSafe": 8.5
  },
  "timestamp": "2026-02-09T16:13:45.123Z"
}
```

### 3. Turbidity (TURB_01)

```json
{
  "sensorId": "TURB_01",
  "value": 12.45,
  "unit": "NTU",
  "limits": {
    "absoluteMin": 0,
    "absoluteMax": 200,
    "minSafe": 0,
    "maxSafe": 20
  },
  "timestamp": "2026-02-09T16:13:50.456Z"
}
```

### 4. Dissolved Oxygen (DO_01)

```json
{
  "sensorId": "DO_01",
  "value": 7.89,
  "unit": "mg/L",
  "limits": {
    "absoluteMin": 0,
    "absoluteMax": 25,
    "minSafe": 5,
    "maxSafe": 10
  },
  "timestamp": "2026-02-09T16:13:50.456Z"
}
```

### 5. Salinity (SAL_01)

```json
{
  "sensorId": "SAL_01",
  "value": 2.34,
  "unit": "ppt",
  "limits": {
    "absoluteMin": 0,
    "absoluteMax": 50,
    "minSafe": 0.5,
    "maxSafe": 5
  },
  "timestamp": "2026-02-09T16:13:50.456Z"
}
```

### 6. Water Color (WCOLOR) - RGB Sensor

```json
{
  "sensorId": "WCOLOR",
  "name": "Water Color",
  "value": {
    "r": 183,
    "g": 209,
    "b": 230
  },
  "unit": "RGB",
  "limits": {
    "absoluteMin": {
      "r": 0,
      "g": 0,
      "b": 0
    },
    "absoluteMax": {
      "r": 255,
      "g": 255,
      "b": 255
    },
    "minSafe": {
      "r": 150,
      "g": 180,
      "b": 200
    },
    "maxSafe": {
      "r": 220,
      "g": 230,
      "b": 255
    }
  },
  "timestamp": "2026-02-09T16:13:50.456Z"
}
```

---

## Testing Scenarios

### Scenario 1: Monitor All Sensors

**Steps:**
1. Connect to `ws://localhost:3000`
2. Leave connection open
3. Observe messages arriving at different intervals
4. Verify high-priority sensors (TEMP_01, PH_01) update every ~2 seconds
5. Verify low-priority sensors (SAL_01, TURB_01, DO_01, WCOLOR) update every ~5 seconds

**Expected Result:**
- Continuous stream of sensor data
- No connection errors
- Timestamps are recent and in ISO 8601 format

### Scenario 2: Verify RGB Color Values

**Steps:**
1. Connect to WebSocket
2. Filter messages for `WCOLOR` events
3. Observe RGB values over multiple broadcasts

**Validation:**
- `r`, `g`, `b` values are integers between 0-255
- Values change gradually (random walk behavior)
- Values never exceed 0-255 bounds

### Scenario 3: Check Safe Range Logic

**Steps:**
1. Monitor sensor data
2. Compare `value` against `limits.minSafe` and `limits.maxSafe`
3. Identify when values go outside safe range

**Example Check (Temperature):**
```javascript
// In Postman Tests tab
pm.test("Temperature is within safe range", function () {
    var data = pm.response.json();
    pm.expect(data.value).to.be.at.least(data.limits.minSafe);
    pm.expect(data.value).to.be.at.most(data.limits.maxSafe);
});
```

---

## Using Socket.IO Client (Alternative)

If you prefer using Socket.IO client library:

### HTML Test Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sensor Monitor</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <h1>Agro Monitor - Sensor Test</h1>
    <div id="sensors"></div>

    <script>
        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        // Listen to all sensors
        ['TEMP_01', 'PH_01', 'TURB_01', 'DO_01', 'SAL_01', 'WCOLOR'].forEach(sensorId => {
            socket.on(sensorId, (data) => {
                console.log(`${sensorId}:`, data);
                
                // Display on page
                const div = document.getElementById('sensors');
                const sensorDiv = document.createElement('div');
                sensorDiv.innerHTML = `<strong>${sensorId}:</strong> ${JSON.stringify(data, null, 2)}`;
                div.appendChild(sensorDiv);
            });
        });
    </script>
</body>
</html>
```

### Node.js Test Script

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('✓ Connected to sensor server');
});

socket.on('TEMP_01', (data) => {
    console.log('🌡️  Temperature:', data.value, data.unit);
});

socket.on('PH_01', (data) => {
    console.log('⚗️  pH Level:', data.value, data.unit);
});

socket.on('WCOLOR', (data) => {
    console.log('🎨 Water Color:', `rgb(${data.value.r}, ${data.value.g}, ${data.value.b})`);
});

socket.on('disconnect', () => {
    console.log('✗ Disconnected from server');
});
```

Run with:
```bash
npm install socket.io-client
node test-sensors.js
```

---

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to `ws://localhost:3000`

**Solutions:**
1. Verify server is running: `npm run start:dev`
2. Check server logs for startup errors
3. Ensure port 3000 is not blocked by firewall
4. Try `ws://127.0.0.1:3000` instead

### No Messages Received

**Problem:** Connected but no sensor data appears

**Solutions:**
1. Check server console for errors
2. Verify sensors are initialized (check server startup logs)
3. Wait at least 5 seconds (low-priority sensors broadcast every 5s)
4. Reconnect the WebSocket

### Invalid JSON

**Problem:** Received data is not valid JSON

**Solutions:**
1. Ensure you're using Socket.IO protocol (not raw WebSocket)
2. Check server is emitting proper JSON format
3. Verify no middleware is modifying the payload

---

## Postman Collection Export

Save this as `agro-monitor-sensors.postman_collection.json`:

```json
{
  "info": {
    "name": "Agro Monitor Sensors",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "WebSocket Connection",
      "request": {
        "method": "WS",
        "url": {
          "raw": "ws://localhost:3000",
          "protocol": "ws",
          "host": ["localhost"],
          "port": "3000"
        }
      }
    }
  ]
}
```

Import this into Postman to quickly set up the WebSocket connection.

---

## Summary

✅ **Connect**: `ws://localhost:3000`  
✅ **Listen**: Automatic - all events broadcast to connected clients  
✅ **Events**: TEMP_01, PH_01, TURB_01, DO_01, SAL_01, WCOLOR  
✅ **Frequency**: High priority (2s), Low priority (5s)  
✅ **Format**: JSON with sensorId, value, unit, limits, timestamp
