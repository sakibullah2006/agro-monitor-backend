import { IsNumber, IsString, IsNotEmpty, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SensorLimitsDto {
  @IsNumber()
  absoluteMin: number;

  @IsNumber()
  absoluteMax: number;

  @IsNumber()
  minSafe: number;

  @IsNumber()
  maxSafe: number;
}

export class SensorDataDto {
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  value: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @ValidateNested()
  @Type(() => SensorLimitsDto)
  limits: SensorLimitsDto;

  @IsISO8601()
  timestamp: string;
}
