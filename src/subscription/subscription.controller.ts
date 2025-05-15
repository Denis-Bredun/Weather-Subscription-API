import { Body, Controller, Post } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscribeRequestDto } from '../common/dto/subscribe-request.dto';
import { SubscribeResponseDto } from '../common/dto/subscribe-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('subscription')
@Controller('api/subscribe')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
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
}
