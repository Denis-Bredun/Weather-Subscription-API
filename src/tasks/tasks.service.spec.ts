import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import { WeatherService } from '../weather/weather.service';
import { Repository } from 'typeorm';
import { mock } from 'jest-mock-extended';
import { Logger } from '@nestjs/common';
import { WeatherResponseDto } from '../common/dto/weather-response.dto';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
});

describe('TasksService', () => {
  let service: TasksService;
  let weatherService: ReturnType<typeof mock<WeatherService>>;
  let subscriptionRepo: ReturnType<typeof mock<Repository<Subscription>>>;

  beforeEach(async () => {
    weatherService = mock<WeatherService>();
    subscriptionRepo = mock<Repository<Subscription>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: WeatherService, useValue: weatherService },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendHourlyForecasts / sendDailyForecasts', () => {
    it('should call processForecasts with "hourly"', async () => {
      const spy = jest
        .spyOn<any, any>(service, 'processForecasts')
        .mockResolvedValue(undefined);
      await service.sendHourlyForecasts();
      expect(spy).toHaveBeenCalledWith('hourly');
    });

    it('should call processForecasts with "daily"', async () => {
      const spy = jest
        .spyOn<any, any>(service, 'processForecasts')
        .mockResolvedValue(undefined);
      await service.sendDailyForecasts();
      expect(spy).toHaveBeenCalledWith('daily');
    });
  });

  describe('processForecasts', () => {
    const sub1 = {
      email: 'user@gmail.com',
      city: 'Paris',
      confirmed: true,
      frequency: 'daily',
    } as Subscription;
    const sub2 = {
      email: 'user2@example.com',
      city: 'Paris',
      confirmed: true,
      frequency: 'daily',
    } as Subscription;
    const weather: WeatherResponseDto = {
      temperature: 20,
      humidity: 55,
      description: 'Clear',
    };

    it('should process forecasts and cache weather', async () => {
      subscriptionRepo.find.mockResolvedValue([sub1, sub2]);
      weatherService.getWeather.mockResolvedValue(weather);
      const sendSpy = jest
        .spyOn<any, any>(service as any, 'sendForecastEmail')
        .mockResolvedValue(undefined);

      await (service as any).processForecasts('daily');

      expect(weatherService.getWeather).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('should catch and log errors when sending fails', async () => {
      subscriptionRepo.find.mockResolvedValue([sub1]);
      weatherService.getWeather.mockResolvedValue(weather);

      const sendSpy = jest.spyOn<any, any>(service as any, 'sendForecastEmail');
      sendSpy.mockRejectedValue(new Error('Send error'));

      await (service as any).processForecasts('daily');

      expect(sendSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendForecastEmail', () => {
    const email = 'user@gmail.com';
    const city = 'London';
    const weather: WeatherResponseDto = {
      temperature: 22,
      humidity: 60,
      description: 'Sunny',
    };

    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.API_BASE_URL = 'http://localhost:3000';
    });

    it('should send email when subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue({
        id: 'some-id',
        email: 'user@gmail.com',
        city: 'London',
        frequency: 'daily',
        confirmed: true,
        unsubscribeToken: 'token123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Subscription);

      await (service as any).sendForecastEmail(email, city, weather);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining(city),
        }),
      );
    });

    it('should log warning when subscription not found', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await (service as any).sendForecastEmail(email, city, weather);

      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
