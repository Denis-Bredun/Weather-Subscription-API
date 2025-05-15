import { ApiProperty } from '@nestjs/swagger';

export class SubscribeResponseDto {
  @ApiProperty({
    description: 'Confirmation message for successful subscription',
    example: 'Subscription created successfully',
  })
  message: string;
}
