import { WeatherService } from './weather.service';
import axios, { AxiosError } from 'axios';
import { HttpStatus, Logger } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;

  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'test_api_key';
    process.env.WEATHER_API_URL = 'https://api.weather.test';
    service = new WeatherService();

    jest
      .spyOn(axios, 'isAxiosError')
      .mockImplementation((err) => !!err.isAxiosError);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch weather and return correct dto', async () => {
    const city = 'London';
    const apiResponse = {
      current: {
        temp_c: 15,
        humidity: 60,
        condition: { text: 'Partly cloudy' },
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ data: apiResponse });

    const result = await service.getWeather(city);

    expect(result).toEqual({
      temperature: 15,
      humidity: 60,
      description: 'Partly cloudy',
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.WEATHER_API_URL}/current.json?key=${process.env.WEATHER_API_KEY}&q=London&aqi=no`,
    );
  });

  it('should throw HttpException BAD_REQUEST for 400 axios error', async () => {
    const city = 'InvalidCity';

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: { message: 'Invalid query' } },
      },
      stack: 'stacktrace',
    } as unknown as AxiosError;

    mockedAxios.get.mockRejectedValueOnce(axiosError);

    await expect(service.getWeather(city)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid request',
    });
  });

  it('should throw HttpException NOT_FOUND for 404 axios error', async () => {
    const city = 'NonexistentCity';

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: { message: 'City not found' } },
      },
      stack: 'stacktrace',
    } as unknown as AxiosError;

    mockedAxios.get.mockRejectedValueOnce(axiosError);

    await expect(service.getWeather(city)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      message: 'City not found',
    });
  });

  it('should throw HttpException INTERNAL_SERVER_ERROR for other axios errors', async () => {
    const city = 'SomeCity';

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: { error: { message: 'Server error' } },
      },
      stack: 'stacktrace',
    } as unknown as AxiosError;

    mockedAxios.get.mockRejectedValueOnce(axiosError);

    await expect(service.getWeather(city)).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Weather service error',
    });
  });

  it('should throw HttpException INTERNAL_SERVER_ERROR for non-axios errors', async () => {
    const city = 'AnyCity';
    const error = new Error('Unexpected error');

    mockedAxios.get.mockRejectedValueOnce(error);

    await expect(service.getWeather(city)).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unexpected error',
    });
  });
});
