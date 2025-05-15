import { ApiProperty } from '@nestjs/swagger';

export class WeatherResponseDto {
  @ApiProperty({ description: 'Current temperature in Celsius' })
  temperature: number;

  @ApiProperty({ description: 'Current humidity percentage' })
  humidity: number;

  @ApiProperty({ description: 'Weather description' })
  description: string;
}
