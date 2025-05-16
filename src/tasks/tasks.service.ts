import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import { WeatherResponseDto } from '../common/dto/weather-response.dto';
import { Repository } from 'typeorm';
import { WeatherService } from '../weather/weather.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private weatherCache = new Map<string, WeatherResponseDto>();
  private inProgress = new Map<string, Promise<WeatherResponseDto>>();

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly weatherService: WeatherService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendHourlyForecasts() {
    await this.processForecasts('hourly');
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyForecasts() {
    await this.processForecasts('daily');
  }

  private async getWeatherWithMemo(city: string): Promise<WeatherResponseDto> {
    const cached = this.weatherCache.get(city);
    if (cached) {
      this.logger.debug(`Cache hit for city=${city}`);
      return cached;
    }

    const inflight = this.inProgress.get(city);
    if (inflight) {
      this.logger.debug(`Waiting for in-progress request for city=${city}`);
      return inflight;
    }

    const promise = this.weatherService.getWeather(city);
    this.inProgress.set(city, promise);

    try {
      const result = await promise;
      this.weatherCache.set(city, result);
      return result;
    } finally {
      this.inProgress.delete(city);
    }
  }

  private async processForecasts(frequency: 'daily' | 'hourly') {
    this.logger.log(`Processing ${frequency} forecasts...`);

    const subscriptions = await this.subscriptionRepo.find({
      where: { confirmed: true, frequency },
    });

    for (const sub of subscriptions) {
      try {
        const weather = await this.getWeatherWithMemo(sub.city);
        await this.sendForecastEmail(sub.email, sub.city, weather);
      } catch (err) {
        this.logger.error(
          `Failed to send forecast to ${sub.email} (${sub.city})`,
          err,
        );
      }
    }
  }

  private async sendForecastEmail(
    email: string,
    city: string,
    weather: WeatherResponseDto,
  ) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const html = `
      <p>Hello!</p>
      <p>Here's the current weather in <b>${city}</b>:</p>
      <ul>
        <li><b>Temperature:</b> ${weather.temperature} °C</li>
        <li><b>Humidity:</b> ${weather.humidity}%</li>
        <li><b>Description:</b> ${weather.description}</li>
      </ul>
      <p>Have a nice day!</p>
    `;

    await transporter.sendMail({
      from: `"Weather App" <${SMTP_USER}>`,
      to: email,
      subject: `Weather Update for ${city}`,
      html,
    });

    this.logger.log(`Forecast email sent to ${email}`);
  }
}
