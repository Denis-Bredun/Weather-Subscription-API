import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherService } from '../weather/weather.service';
import { Subscription } from './entities/subscription.entity';
import { SubscribeRequestDto } from '../common/dto/subscribe-request.dto';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly weatherService: WeatherService,
  ) {}

  async subscribe(dto: SubscribeRequestDto): Promise<void> {
    const { email, city, frequency } = dto;
    this.logger.log(
      `Subscription request received for email="${email}", city="${city}", frequency="${frequency}"`,
    );

    try {
      await this.weatherService.getWeather(city);
    } catch {
      this.logger.warn(`Invalid city in subscription request: "${city}"`);
      throw new BadRequestException('Invalid city name');
    }

    const existing = await this.subscriptionRepo.findOne({
      where: { email, city },
    });

    if (existing) {
      if (existing.confirmed) {
        this.logger.warn(
          `Subscription already exists and confirmed for email="${email}", city="${city}"`,
        );
        throw new ConflictException(
          'Subscription already exists for this email and city',
        );
      } else {
        this.logger.log(
          `Subscription exists but not confirmed for email="${email}", city="${city}". Resending confirmation email.`,
        );

        existing.confirmationToken = uuidv4();
        existing.unsubscribeToken = uuidv4();
        existing.frequency = frequency;

        try {
          await this.subscriptionRepo.save(existing);
          this.logger.log(
            `Updated subscription tokens for ${email} (${city}, ${frequency})`,
          );
        } catch (err) {
          this.logger.error('Failed to update subscription', err);
          throw new InternalServerErrorException(
            'Failed to update subscription',
          );
        }

        await this.sendConfirmationEmail(email, existing.confirmationToken);
        return;
      }
    }

    const confirmationToken = uuidv4();
    const unsubscribeToken = uuidv4();

    const subscription = this.subscriptionRepo.create({
      email,
      city,
      frequency,
      confirmed: false,
      confirmationToken,
      unsubscribeToken,
    });

    try {
      await this.subscriptionRepo.save(subscription);
      this.logger.log(
        `Saved new subscription for ${email} (${city}, ${frequency})`,
      );
    } catch (err) {
      this.logger.error('Failed to save subscription', err);
      throw new InternalServerErrorException('Failed to save subscription');
    }

    this.logger.log(`Sending confirmation email to ${email}`);
    await this.sendConfirmationEmail(email, confirmationToken);
  }

  private async sendConfirmationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, API_BASE_URL } =
      process.env;

    this.logger.debug('SMTP configuration:', {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS: SMTP_PASS ? '****' : undefined, // не логируем пароль явно
      API_BASE_URL,
    });

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: false,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const confirmUrl = `${API_BASE_URL}/api/confirm/${token}`;

      await transporter.sendMail({
        from: `"Weather App" <${SMTP_USER}>`,
        to: email,
        subject: 'Confirm your subscription',
        html: `
        <p>Hello!</p>
        <p>Thank you for subscribing to our weather forecast service.</p>
        <p>Please confirm your subscription by clicking the link below:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>If you did not subscribe to this service, please ignore this email.</p>
        <p>Best regards,<br/>The Weather App Team</p>
        `,
      });

      this.logger.log(`Confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${email}`, error);
      throw new InternalServerErrorException(
        'Failed to send confirmation email',
      );
    }
  }

  async confirmSubscription(token: string): Promise<string> {
    if (!token || typeof token !== 'string') {
      this.logger.warn(`Confirm subscription failed: invalid token provided`);
      throw new BadRequestException('Invalid token');
    }

    const subscription = await this.subscriptionRepo.findOne({
      where: { confirmationToken: token },
    });

    if (!subscription) {
      this.logger.warn(
        `Confirm subscription failed: token not found (${token})`,
      );
      throw new NotFoundException('Token not found');
    }

    if (subscription.confirmed) {
      this.logger.log(
        `Subscription already confirmed for email="${subscription.email}"`,
      );
      return 'Subscription already confirmed';
    }

    subscription.confirmed = true;
    await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Subscription confirmed for email="${subscription.email}", city="${subscription.city}"`,
    );

    return 'Subscription confirmed successfully';
  }

  async unsubscribe(token: string): Promise<string> {
    if (!token || typeof token !== 'string') {
      this.logger.warn(`Unsubscribe failed: invalid token`);
      throw new BadRequestException('Invalid token');
    }

    const subscription = await this.subscriptionRepo.findOne({
      where: { unsubscribeToken: token },
    });

    if (!subscription) {
      this.logger.warn(`Unsubscribe failed: token not found (${token})`);
      throw new NotFoundException('Token not found');
    }

    await this.subscriptionRepo.remove(subscription);

    this.logger.log(
      `Unsubscribed ${subscription.email} from ${subscription.city}`,
    );
    return 'Unsubscribed successfully';
  }
}
