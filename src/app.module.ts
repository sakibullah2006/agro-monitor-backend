import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';

@Module({
  imports: [SensorsModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
