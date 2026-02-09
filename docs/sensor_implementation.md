# RGB Water Color Sensor Implementation Walkthrough

Successfully implemented a water color sensor (WCOLOR) that sends RGB color values to track water quality through color measurements.

## Changes Made

### 1. Created RGB Sensor DTO

Created [rgb-sensor-data.dto.ts](file:///d:/apps/agro-monitor/agro-monitor-backend/src/sensors/dto/rgb-sensor-data.dto.ts) with the following structure:

- `RgbValueDto`: Holds R, G, B values (0-255 each)
- `RgbLimitsDto`: Holds RGB limits (absoluteMin, absoluteMax, minSafe, maxSafe)
- `RgbSensorDataDto`: Complete sensor data payload with RGB values

All DTOs include proper validation decorators (`@IsNumber`, `@ValidateNested`, etc.).

---

### 2. Updated Sensor Service

Modified [sensors.service.ts](file:///d:/apps/agro-monitor/agro-monitor-backend/src/sensors/sensors.service.ts):

#### Updated `SensorConfig` Interface
```typescript
interface SensorConfig {
    id: string;
    absoluteMin: number | RgbValueDto;
    absoluteMax: number | RgbValueDto;
    minSafe: number | RgbValueDto;
    maxSafe: number | RgbValueDto;
    unit: string;
    currentValue: number | RgbValueDto;
}
```

#### Added WCOLOR Sensor Configuration
```typescript
{ 
    id: 'WCOLOR', 
    absoluteMin: { r: 0, g: 0, b: 0 }, 
    absoluteMax: { r: 255, g: 255, b: 255 }, 
    minSafe: { r: 150, g: 180, b: 200 }, 
    maxSafe: { r: 220, g: 230, b: 255 }, 
    unit: 'RGB', 
    currentValue: { r: 180, g: 210, b: 230 } 
}
```

**Initial Values Rationale:**
- R=180, G=210, B=230 represents clean, clear water
- Higher blue values indicate clearer water
- Higher green values indicate healthier water
- Lower red values indicate cleaner water

#### Rewrote `generateNextValue()` Method

The method now:
1. **Detects sensor type** using type guards (`typeof` and `'r' in value`)
2. **Handles RGB sensors** by applying random walk to each color channel independently
3. **Handles numeric sensors** with the original logic
4. **Returns appropriate DTO type** (`RgbSensorDataDto` or `SensorDataDto`)

**RGB Random Walk Logic:**
- Each R, G, B channel gets independent random walk
- ±5% of channel range (0-255) per update
- Values clamped to 0-255 boundaries
- RGB values rounded to integers

---

### 3. Updated WebSocket Gateway

Modified [sensors.gateway.ts](file:///d:/apps/agro-monitor/agro-monitor-backend/src/sensors/sensors.gateway.ts#L39):

Added `WCOLOR` to low priority broadcasting interval:
```typescript
this.lowPriorityInterval = setInterval(() => {
    this.broadcastSensorData(['SAL_01', 'TURB_01', 'DO_01', 'WCOLOR']);
}, 5000);
```

**Broadcasting Schedule:**
- **High Priority (2s)**: TEMP_01, PH_01
- **Low Priority (5s)**: SAL_01, TURB_01, DO_01, **WCOLOR**

---

## Testing Results

### ✅ Server Startup
- Compilation: **0 errors**
- Nest application started successfully
- All sensors initialized including WCOLOR
- WebSocket gateway active and accepting connections

### ✅ Sensor Data Structure

The WCOLOR sensor generates data in the following format:

```json
{
  "sensorId": "WCOLOR",
  "value": {
    "r": 180,
    "g": 210,
    "b": 230
  },
  "unit": "RGB",
  "limits": {
    "absoluteMin": { "r": 0, "g": 0, "b": 0 },
    "absoluteMax": { "r": 255, "g": 255, "b": 255 },
    "minSafe": { "r": 150, "g": 180, "b": 200 },
    "maxSafe": { "r": 220, "g": 230, "b": 255 }
  },
  "timestamp": "2026-02-09T16:09:50.123Z"
}
```

### ✅ Random Walk Behavior

Each color channel changes independently:
- R, G, B values vary by ±12.75 per update (5% of 255)
- Values stay within 0-255 bounds
- Gradual, realistic color changes over time

---

## Usage

### Listening to WCOLOR Events

**WebSocket Client Example:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('WCOLOR', (data) => {
  console.log('Water Color:', data.value);
  // { r: 180, g: 210, b: 230 }
  
  // Check if water is safe
  const isSafe = 
    data.value.r >= data.limits.minSafe.r &&
    data.value.r <= data.limits.maxSafe.r &&
    data.value.g >= data.limits.minSafe.g &&
    data.value.g <= data.limits.maxSafe.g &&
    data.value.b >= data.limits.minSafe.b &&
    data.value.b <= data.limits.maxSafe.b;
  
  console.log('Water is safe:', isSafe);
});
```

### Displaying RGB Color

**Frontend Example:**
```javascript
socket.on('WCOLOR', (data) => {
  const { r, g, b } = data.value;
  const colorDiv = document.getElementById('water-color');
  colorDiv.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
});
```

---

## Summary

✅ **Created** RGB sensor DTO structure  
✅ **Updated** sensor service to support multi-value sensors  
✅ **Implemented** independent random walk for each RGB channel  
✅ **Added** WCOLOR to WebSocket broadcasting (5-second interval)  
✅ **Tested** server startup and sensor initialization  
✅ **Verified** RGB data structure and boundaries

The WCOLOR sensor is now fully operational and broadcasting RGB water color data every 5 seconds! 🎨💧
