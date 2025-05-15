import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WeatherRequestDto {
  @ApiProperty({
    description: 'City name for weather forecast',
    example: 'New York',
  })
  @IsString()
  @IsNotEmpty()
  city: string;
}
