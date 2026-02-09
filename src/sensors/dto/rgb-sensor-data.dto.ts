import { IsNumber, IsString, IsNotEmpty, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RgbValueDto {
    @IsNumber()
    r: number;

    @IsNumber()
    g: number;

    @IsNumber()
    b: number;
}

export class RgbLimitsDto {
    @ValidateNested()
    @Type(() => RgbValueDto)
    absoluteMin: RgbValueDto;

    @ValidateNested()
    @Type(() => RgbValueDto)
    absoluteMax: RgbValueDto;

    @ValidateNested()
    @Type(() => RgbValueDto)
    minSafe: RgbValueDto;

    @ValidateNested()
    @Type(() => RgbValueDto)
    maxSafe: RgbValueDto;
}

export class RgbSensorDataDto {
    @IsString()
    @IsNotEmpty()
    sensorId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => RgbValueDto)
    value: RgbValueDto;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @ValidateNested()
    @Type(() => RgbLimitsDto)
    limits: RgbLimitsDto;

    @IsISO8601()
    timestamp: string;
}
