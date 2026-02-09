import { Test, TestingModule } from '@nestjs/testing';
import { SensorsService } from '../sensors.service';

describe('WCOLOR RGB Sensor Test', () => {
    let service: SensorsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SensorsService],
        }).compile();

        service = module.get<SensorsService>(SensorsService);
    });

    it('should generate RGB values for WCOLOR sensor', () => {
        const data = service.generateNextValue('WCOLOR');

        console.log('WCOLOR Sensor Data:', JSON.stringify(data, null, 2));

        expect(data.sensorId).toBe('WCOLOR');
        expect(data.unit).toBe('RGB');
        expect(data.value).toHaveProperty('r');
        expect(data.value).toHaveProperty('g');
        expect(data.value).toHaveProperty('b');

        // Check that RGB values are within bounds (0-255)
        expect(data.value.r).toBeGreaterThanOrEqual(0);
        expect(data.value.r).toBeLessThanOrEqual(255);
        expect(data.value.g).toBeGreaterThanOrEqual(0);
        expect(data.value.g).toBeLessThanOrEqual(255);
        expect(data.value.b).toBeGreaterThanOrEqual(0);
        expect(data.value.b).toBeLessThanOrEqual(255);
    });

    it('should apply random walk to RGB values', () => {
        const data1 = service.generateNextValue('WCOLOR');
        const data2 = service.generateNextValue('WCOLOR');

        console.log('First reading:', data1.value);
        console.log('Second reading:', data2.value);

        // Values should change (with very high probability)
        const hasChanged =
            data1.value.r !== data2.value.r ||
            data1.value.g !== data2.value.g ||
            data1.value.b !== data2.value.b;

        expect(hasChanged).toBe(true);
    });
});
