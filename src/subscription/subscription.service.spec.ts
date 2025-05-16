import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { WeatherService } from '../weather/weather.service';
import { SubscribeRequestDto } from '../common/dto/subscribe-request.dto';
import { WeatherResponseDto } from '../common/dto/weather-response.dto';
import { mock } from 'jest-mock-extended';
import * as nodemailer from 'nodemailer';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

jest.mock('nodemailer');

const mockSendMail = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
});

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepo: ReturnType<typeof mock<Repository<Subscription>>>;
  let weatherService: ReturnType<typeof mock<WeatherService>>;

  const dto: SubscribeRequestDto = {
    email: 'test@example.com',
    city: 'London',
    frequency: 'daily',
  };

  beforeEach(async () => {
    subscriptionRepo = mock<Repository<Subscription>>();
    weatherService = mock<WeatherService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
        { provide: WeatherService, useValue: weatherService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);

    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.API_BASE_URL = 'http://localhost:3000';

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    const validWeather: WeatherResponseDto = {
      temperature: 25,
      humidity: 60,
      description: 'Sunny',
    };

    const confirmedSub: Subscription = {
      email: 'user@example.com',
      city: 'Paris',
      frequency: 'daily',
      confirmed: true,
      confirmationToken: 'token1',
      unsubscribeToken: 'unsub1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Subscription;

    const unconfirmedSub: Subscription = {
      email: 'user@example.com',
      city: 'Paris',
      frequency: 'hourly',
      confirmed: false,
      confirmationToken: 'old-token',
      unsubscribeToken: 'old-unsub-token',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Subscription;

    const newSub: Subscription = {
      id: '123',
      email: 'user@example.com',
      city: 'Paris',
      frequency: 'daily',
      confirmed: false,
      confirmationToken: 'new-token',
      unsubscribeToken: 'new-unsub-token',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Subscription;

    it('should throw BadRequestException if city is invalid', async () => {
      weatherService.getWeather.mockRejectedValue(new Error());
      await expect(service.subscribe(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if subscription already confirmed', async () => {
      weatherService.getWeather.mockResolvedValue(validWeather);
      subscriptionRepo.findOne.mockResolvedValue(confirmedSub);
      await expect(service.subscribe(dto)).rejects.toThrow(ConflictException);
    });

    it('should resend email if subscription exists but not confirmed', async () => {
      weatherService.getWeather.mockResolvedValue(validWeather);
      subscriptionRepo.findOne.mockResolvedValue(unconfirmedSub);
      subscriptionRepo.save.mockResolvedValue(unconfirmedSub);

      await expect(service.subscribe(dto)).resolves.toBeUndefined();
      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should save and send confirmation email for new subscription', async () => {
      weatherService.getWeather.mockResolvedValue(validWeather);
      subscriptionRepo.findOne.mockResolvedValue(null);
      subscriptionRepo.create.mockReturnValue(newSub);
      subscriptionRepo.save.mockResolvedValue(newSub);

      await expect(service.subscribe(dto)).resolves.toBeUndefined();
      expect(subscriptionRepo.save).toHaveBeenCalledWith(newSub);
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should throw if save fails', async () => {
      weatherService.getWeather.mockResolvedValue(validWeather);
      subscriptionRepo.findOne.mockResolvedValue(null);
      subscriptionRepo.create.mockReturnValue(newSub);
      subscriptionRepo.save.mockRejectedValue(new Error());

      await expect(service.subscribe(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('confirmSubscription', () => {
    it('should throw BadRequestException for invalid token', async () => {
      await expect(service.confirmSubscription('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if token not found', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(service.confirmSubscription('token123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return message if already confirmed', async () => {
      subscriptionRepo.findOne.mockResolvedValue({
        confirmed: true,
        email: 'test@example.com',
      } as Subscription);
      const result = await service.confirmSubscription('token123');
      expect(result).toBe('Subscription already confirmed');
    });

    it('should confirm subscription if valid', async () => {
      const sub = {
        confirmed: false,
        email: 'test@example.com',
      } as Subscription;
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockResolvedValue(sub);

      const result = await service.confirmSubscription('token123');
      expect(result).toBe('Subscription confirmed successfully');
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should throw BadRequestException for invalid token', async () => {
      await expect(service.unsubscribe('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if token not found', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(service.unsubscribe('token123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove subscription if valid token', async () => {
      const sub = { email: 'test@example.com', city: 'London' } as Subscription;
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.remove.mockResolvedValue(sub);

      const result = await service.unsubscribe('token123');
      expect(result).toBe('Unsubscribed successfully');
      expect(subscriptionRepo.remove).toHaveBeenCalledWith(sub);
    });
  });
});
