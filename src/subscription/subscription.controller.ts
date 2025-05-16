import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscribeRequestDto } from '../common/dto/subscribe-request.dto';
import { SubscribeResponseDto } from '../common/dto/subscribe-response.dto';
import { ConfirmResponseDto } from '../common/dto/confirm-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('subscription')
@Controller('api')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to weather updates' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: 'Subscription successful. Confirmation email sent.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already subscribed' })
  async subscribe(
    @Body() dto: SubscribeRequestDto,
  ): Promise<SubscribeResponseDto> {
    await this.subscriptionService.subscribe(dto);
    return { message: 'Subscription created. Check your email to confirm.' };
  }

  @Get('confirm/:token')
  @ApiOperation({ summary: 'Confirm email subscription' })
  @ApiParam({
    name: 'token',
    description: 'Confirmation token',
    required: true,
    type: String,
  })
  @ApiResponse({ status: 200, type: ConfirmResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async confirm(@Param('token') token: string): Promise<ConfirmResponseDto> {
    const message = await this.subscriptionService.confirmSubscription(token);
    return { message };
  }
}
