import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherResponseDto } from '../common/dto/weather-response.dto';
import { WeatherRequestDto } from '../common/dto/weather-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('api')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('weather')
  @ApiOperation({ summary: 'Get current weather for a city' })
  @ApiQuery({
    name: 'city',
    description: 'City name to get weather for',
    required: true,
    type: String,
  })
  @ApiResponse({ status: 200, type: WeatherResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getWeather(
    @Query() query: WeatherRequestDto,
  ): Promise<WeatherResponseDto> {
    return this.weatherService.getWeather(query.city);
  }
}
