import { Injectable } from '@nestjs/common';
import { SensorDataDto } from './dto/sensor-data.dto';
import { RgbSensorDataDto, RgbValueDto } from './dto/rgb-sensor-data.dto';

interface SensorConfig {
    id: string;
    name: string;
    absoluteMin: number | RgbValueDto;
    absoluteMax: number | RgbValueDto;
    minSafe: number | RgbValueDto;
    maxSafe: number | RgbValueDto;
    unit: string;
    currentValue: number | RgbValueDto;
}

@Injectable()
export class SensorsService {
    private sensors: Map<string, SensorConfig> = new Map();

    constructor() {
        this.initializeSensors();
    }

    private initializeSensors() {
        // Define initial configurations based on the spec
        const configs: SensorConfig[] = [
            { id: 'TEMP_01', name: 'Temperature', absoluteMin: 0.0, absoluteMax: 60.0, minSafe: 22.0, maxSafe: 32.0, unit: '°C', currentValue: 25.0 },
            { id: 'PH_01', name: 'pH Level', absoluteMin: 0.0, absoluteMax: 14.0, minSafe: 6.5, maxSafe: 8.5, unit: 'pH', currentValue: 7.0 },
            { id: 'TURB_01', name: 'Turbidity', absoluteMin: 0.0, absoluteMax: 200.0, minSafe: 0.0, maxSafe: 20.0, unit: 'NTU', currentValue: 10.0 }, // Assuming 0-20 is safe based on "0.0 — 20.0"
            { id: 'DO_01', name: 'Dissolved Oxygen', absoluteMin: 0.0, absoluteMax: 25.0, minSafe: 5.0, maxSafe: 10.0, unit: 'mg/L', currentValue: 7.5 },
            { id: 'SAL_01', name: 'Salinity', absoluteMin: 0.0, absoluteMax: 50.0, minSafe: 0.5, maxSafe: 5.0, unit: 'ppt', currentValue: 2.0 },
            {
                id: 'WCOLOR',
                name: 'Water Color',
                absoluteMin: { r: 0, g: 0, b: 0 },
                absoluteMax: { r: 255, g: 255, b: 255 },
                minSafe: { r: 150, g: 180, b: 200 },
                maxSafe: { r: 220, g: 230, b: 255 },
                unit: 'RGB',
                currentValue: { r: 180, g: 210, b: 230 }
            },
        ];

        configs.forEach(config => {
            this.sensors.set(config.id, config);
        });
    }

    // Generate next value using Random Walk
    generateNextValue(sensorId: string): SensorDataDto | RgbSensorDataDto {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error(`Sensor ${sensorId} not found`);
        }

        // Check if this is an RGB sensor
        const isRgbSensor = typeof sensor.currentValue === 'object' && 'r' in sensor.currentValue;

        if (isRgbSensor) {
            // Handle RGB sensor
            const currentValue = sensor.currentValue as RgbValueDto;
            const absoluteMin = sensor.absoluteMin as RgbValueDto;
            const absoluteMax = sensor.absoluteMax as RgbValueDto;
            const minSafe = sensor.minSafe as RgbValueDto;
            const maxSafe = sensor.maxSafe as RgbValueDto;

            // Apply random walk to each channel independently
            const applyRandomWalk = (current: number, min: number, max: number): number => {
                const range = max - min;
                const maxStep = range * 0.05; // 5% max step
                const offset = (Math.random() * maxStep * 2) - maxStep;
                let newValue = current + offset;

                // Clamp to boundaries
                if (newValue < min) newValue = min;
                if (newValue > max) newValue = max;

                return Math.round(newValue); // RGB values are integers
            };

            const newValue: RgbValueDto = {
                r: applyRandomWalk(currentValue.r, absoluteMin.r, absoluteMax.r),
                g: applyRandomWalk(currentValue.g, absoluteMin.g, absoluteMax.g),
                b: applyRandomWalk(currentValue.b, absoluteMin.b, absoluteMax.b),
            };

            // Update state
            sensor.currentValue = newValue;
            this.sensors.set(sensorId, sensor);

            // Construct RGB Payload
            return {
                sensorId: sensor.id,
                name: sensor.name,
                value: newValue,
                unit: sensor.unit,
                limits: {
                    absoluteMin,
                    absoluteMax,
                    minSafe,
                    maxSafe,
                },
                timestamp: new Date().toISOString(),
            };
        } else {
            // Handle numeric sensor
            const currentValue = sensor.currentValue as number;
            const absoluteMin = sensor.absoluteMin as number;
            const absoluteMax = sensor.absoluteMax as number;
            const minSafe = sensor.minSafe as number;
            const maxSafe = sensor.maxSafe as number;

            // Bias towards the center of the safe range to keep values mostly safe
            const safeCenter = (minSafe + maxSafe) / 2;
            const isUnsafe = currentValue < minSafe || currentValue > maxSafe;
            // Stronger pull if outside safe range, gentle pull if inside
            const biasFactor = isUnsafe ? 0.1 : 0.05;
            const bias = (safeCenter - currentValue) * biasFactor;

            // Random Walk: New Value = Previous Value + (Small Random Offset)
            const range = absoluteMax - absoluteMin;
            const maxStep = range * 0.02; // Reduced to 2% max step (was 5%) for stability
            const offset = (Math.random() * maxStep * 2) - maxStep;

            let newValue = currentValue + offset + bias;

            // Boundary Check (Clamping)
            if (newValue < absoluteMin) newValue = absoluteMin;
            if (newValue > absoluteMax) newValue = absoluteMax;

            // Update state
            sensor.currentValue = newValue;
            this.sensors.set(sensorId, sensor);

            // Construct Payload
            return {
                sensorId: sensor.id,
                name: sensor.name,
                value: parseFloat(newValue.toFixed(2)), // Format to 2 decimal places
                unit: sensor.unit,
                limits: {
                    absoluteMin,
                    absoluteMax,
                    minSafe,
                    maxSafe,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }

    getSensor(sensorId: string): SensorConfig | undefined {
        return this.sensors.get(sensorId);
    }
}
