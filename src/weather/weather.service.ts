import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { WeatherResponseDto } from '../common/dto/weather-response.dto';
import { WeatherApiResponse } from '../common/interfaces/weather.interfaces';

@Injectable()
export class WeatherService {
  private readonly apiKey = process.env.WEATHER_API_KEY;
  private readonly baseUrl = process.env.WEATHER_API_URL;
  private readonly logger = new Logger(WeatherService.name);

  async getWeather(city: string): Promise<WeatherResponseDto> {
    this.logger.log(`Fetching weather for city="${city}"`);
    try {
      const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
      this.logger.debug(`Request URL: ${url}`);

      const { data } = await axios.get<WeatherApiResponse>(url);

      this.logger.log(`Weather fetched successfully for city="${city}"`);

      return {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        description: data.current.condition.text,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Weather fetch failed for city="${city}"`,
        error instanceof Error ? error.stack : undefined,
      );

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: { message: string } }>;
        const status = axiosError.response?.status;
        const message =
          axiosError.response?.data?.error?.message || 'Weather service error';

        this.logger.error(`Axios error message: ${message}`);

        if (status === 400) {
          throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        if (status === 404) {
          throw new HttpException('City not found', HttpStatus.NOT_FOUND);
        }

        throw new HttpException(
          'Weather service error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Unexpected error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
