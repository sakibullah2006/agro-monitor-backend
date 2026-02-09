# Flutter Integration Guide - Agro Monitor Sensors

Complete guide for integrating the Agro Monitor sensor WebSocket API into your Flutter application.

## Prerequisites

Add the Socket.IO client package to your `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

Run:
```bash
flutter pub get
```

---

## Sensor Data Models

### 1. Numeric Sensor Model

```dart
class SensorLimits {
  final double absoluteMin;
  final double absoluteMax;
  final double minSafe;
  final double maxSafe;

  SensorLimits({
    required this.absoluteMin,
    required this.absoluteMax,
    required this.minSafe,
    required this.maxSafe,
  });

  factory SensorLimits.fromJson(Map<String, dynamic> json) {
    return SensorLimits(
      absoluteMin: json['absoluteMin'].toDouble(),
      absoluteMax: json['absoluteMax'].toDouble(),
      minSafe: json['minSafe'].toDouble(),
      maxSafe: json['maxSafe'].toDouble(),
    );
  }
}

class SensorData {
  final String sensorId;
  final double value;
  final String unit;
  final SensorLimits limits;
  final DateTime timestamp;

  SensorData({
    required this.sensorId,
    required this.value,
    required this.unit,
    required this.limits,
    required this.timestamp,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    return SensorData(
      sensorId: json['sensorId'],
      value: json['value'].toDouble(),
      unit: json['unit'],
      limits: SensorLimits.fromJson(json['limits']),
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  bool get isSafe => value >= limits.minSafe && value <= limits.maxSafe;
}
```

### 2. RGB Sensor Model

```dart
class RgbValue {
  final int r;
  final int g;
  final int b;

  RgbValue({required this.r, required this.g, required this.b});

  factory RgbValue.fromJson(Map<String, dynamic> json) {
    return RgbValue(
      r: json['r'],
      g: json['g'],
      b: json['b'],
    );
  }

  Color toColor() => Color.fromRGBO(r, g, b, 1.0);
}

class RgbLimits {
  final RgbValue absoluteMin;
  final RgbValue absoluteMax;
  final RgbValue minSafe;
  final RgbValue maxSafe;

  RgbLimits({
    required this.absoluteMin,
    required this.absoluteMax,
    required this.minSafe,
    required this.maxSafe,
  });

  factory RgbLimits.fromJson(Map<String, dynamic> json) {
    return RgbLimits(
      absoluteMin: RgbValue.fromJson(json['absoluteMin']),
      absoluteMax: RgbValue.fromJson(json['absoluteMax']),
      minSafe: RgbValue.fromJson(json['minSafe']),
      maxSafe: RgbValue.fromJson(json['maxSafe']),
    );
  }
}

class RgbSensorData {
  final String sensorId;
  final RgbValue value;
  final String unit;
  final RgbLimits limits;
  final DateTime timestamp;

  RgbSensorData({
    required this.sensorId,
    required this.value,
    required this.unit,
    required this.limits,
    required this.timestamp,
  });

  factory RgbSensorData.fromJson(Map<String, dynamic> json) {
    return RgbSensorData(
      sensorId: json['sensorId'],
      value: RgbValue.fromJson(json['value']),
      unit: json['unit'],
      limits: RgbLimits.fromJson(json['limits']),
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  bool get isSafe {
    return value.r >= limits.minSafe.r && value.r <= limits.maxSafe.r &&
           value.g >= limits.minSafe.g && value.g <= limits.maxSafe.g &&
           value.b >= limits.minSafe.b && value.b <= limits.maxSafe.b;
  }
}
```

---

## WebSocket Service

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SensorWebSocketService {
  late IO.Socket socket;
  
  // Sensor data streams
  final _tempController = StreamController<SensorData>.broadcast();
  final _phController = StreamController<SensorData>.broadcast();
  final _turbController = StreamController<SensorData>.broadcast();
  final _doController = StreamController<SensorData>.broadcast();
  final _salController = StreamController<SensorData>.broadcast();
  final _wcolorController = StreamController<RgbSensorData>.broadcast();

  Stream<SensorData> get tempStream => _tempController.stream;
  Stream<SensorData> get phStream => _phController.stream;
  Stream<SensorData> get turbidityStream => _turbController.stream;
  Stream<SensorData> get dissolvedOxygenStream => _doController.stream;
  Stream<SensorData> get salinityStream => _salController.stream;
  Stream<RgbSensorData> get waterColorStream => _wcolorController.stream;

  void connect(String serverUrl) {
    socket = IO.io(serverUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build()
    );

    socket.onConnect((_) {
      print('Connected to sensor server');
    });

    socket.onDisconnect((_) {
      print('Disconnected from sensor server');
    });

    // Listen to sensor events
    socket.on('TEMP_01', (data) {
      _tempController.add(SensorData.fromJson(data));
    });

    socket.on('PH_01', (data) {
      _phController.add(SensorData.fromJson(data));
    });

    socket.on('TURB_01', (data) {
      _turbController.add(SensorData.fromJson(data));
    });

    socket.on('DO_01', (data) {
      _doController.add(SensorData.fromJson(data));
    });

    socket.on('SAL_01', (data) {
      _salController.add(SensorData.fromJson(data));
    });

    socket.on('WCOLOR', (data) {
      _wcolorController.add(RgbSensorData.fromJson(data));
    });

    socket.connect();
  }

  void disconnect() {
    socket.disconnect();
    _tempController.close();
    _phController.close();
    _turbController.close();
    _doController.close();
    _salController.close();
    _wcolorController.close();
  }
}
```

---

## Usage Examples

### 1. Basic Connection

```dart
class SensorScreen extends StatefulWidget {
  @override
  _SensorScreenState createState() => _SensorScreenState();
}

class _SensorScreenState extends State<SensorScreen> {
  final SensorWebSocketService _sensorService = SensorWebSocketService();
  
  @override
  void initState() {
    super.initState();
    _sensorService.connect('http://localhost:3000');
  }

  @override
  void dispose() {
    _sensorService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Sensor Monitor')),
      body: Column(
        children: [
          TemperatureWidget(stream: _sensorService.tempStream),
          PhWidget(stream: _sensorService.phStream),
          WaterColorWidget(stream: _sensorService.waterColorStream),
        ],
      ),
    );
  }
}
```

### 2. Temperature Widget

```dart
class TemperatureWidget extends StatelessWidget {
  final Stream<SensorData> stream;

  const TemperatureWidget({required this.stream});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SensorData>(
      stream: stream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return CircularProgressIndicator();
        }

        final data = snapshot.data!;
        final isSafe = data.isSafe;

        return Card(
          color: isSafe ? Colors.green[50] : Colors.red[50],
          child: ListTile(
            leading: Icon(
              Icons.thermostat,
              color: isSafe ? Colors.green : Colors.red,
            ),
            title: Text('Temperature'),
            subtitle: Text(
              '${data.value.toStringAsFixed(1)} ${data.unit}',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            trailing: Text(
              isSafe ? 'Safe' : 'Warning',
              style: TextStyle(
                color: isSafe ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      },
    );
  }
}
```

### 3. Water Color Widget (RGB)

```dart
class WaterColorWidget extends StatelessWidget {
  final Stream<RgbSensorData> stream;

  const WaterColorWidget({required this.stream});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<RgbSensorData>(
      stream: stream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return CircularProgressIndicator();
        }

        final data = snapshot.data!;
        final color = data.value.toColor();
        final isSafe = data.isSafe;

        return Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.water_drop, color: color),
                    SizedBox(width: 8),
                    Text('Water Color', 
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
                    ),
                  ],
                ),
                SizedBox(height: 12),
                Container(
                  height: 60,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey),
                  ),
                ),
                SizedBox(height: 8),
                Text('R: ${data.value.r}, G: ${data.value.g}, B: ${data.value.b}'),
                Text(
                  isSafe ? '✓ Safe' : '⚠ Warning',
                  style: TextStyle(
                    color: isSafe ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

---

## Available Sensors

| Sensor ID | Type | Unit | Update Interval | Description |
|-----------|------|------|-----------------|-------------|
| `TEMP_01` | Numeric | °C | 2 seconds | Water Temperature |
| `PH_01` | Numeric | pH | 2 seconds | pH Level |
| `TURB_01` | Numeric | NTU | 5 seconds | Turbidity |
| `DO_01` | Numeric | mg/L | 5 seconds | Dissolved Oxygen |
| `SAL_01` | Numeric | ppt | 5 seconds | Salinity |
| `WCOLOR` | RGB | RGB | 5 seconds | Water Color |
