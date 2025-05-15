import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WeatherQueryDto {
  @ApiProperty({ description: 'City name for weather forecast' })
  @IsString()
  @IsNotEmpty()
  city: string;
}
