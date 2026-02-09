import { Module } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';

@Module({
    providers: [SensorsService, SensorsGateway],
    exports: [SensorsService],
})
export class SensorsModule { }
