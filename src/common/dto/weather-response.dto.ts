import { ApiProperty } from '@nestjs/swagger';

export class WeatherResponseDto {
  @ApiProperty({
    description: 'Current temperature in Celsius',
    example: 23.5,
  })
  temperature: number;

  @ApiProperty({
    description: 'Current humidity percentage',
    example: 65,
  })
  humidity: number;

  @ApiProperty({
    description: 'Weather description',
    example: 'Partly cloudy',
  })
  description: string;
}
