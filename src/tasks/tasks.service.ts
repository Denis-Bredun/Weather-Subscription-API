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

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly weatherService: WeatherService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendHourlyForecasts() {
    await this.processForecasts('hourly');
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyForecasts() {
    await this.processForecasts('daily');
  }

  private async processForecasts(frequency: 'daily' | 'hourly') {
    this.logger.log(`Processing ${frequency} forecasts...`);

    const subscriptions = await this.subscriptionRepo.find({
      where: { confirmed: true, frequency },
    });

    const weatherCache = new Map<string, WeatherResponseDto>();

    for (const sub of subscriptions) {
      try {
        let weather = weatherCache.get(sub.city);

        if (!weather) {
          weather = await this.weatherService.getWeather(sub.city);
          weatherCache.set(sub.city, weather);
        }

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
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, APP_BASE_URL } =
      process.env;

    const subscription = await this.subscriptionRepo.findOne({
      where: { email, city, confirmed: true },
      select: ['unsubscribeToken'],
    });

    if (!subscription) {
      this.logger.warn(`No active subscription found for ${email} (${city})`);
      return;
    }

    const unsubscribeLink = `${APP_BASE_URL}/api/unsubscribe/${encodeURIComponent(subscription.unsubscribeToken)}`;

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
    <p>If you no longer wish to receive updates, you can <a href="${unsubscribeLink}">unsubscribe here</a>.</p>
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
