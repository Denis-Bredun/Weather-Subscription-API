import { ApiProperty } from '@nestjs/swagger';

export class ConfirmResponseDto {
  @ApiProperty({
    description: 'Confirmation result message',
    example: 'Subscription confirmed successfully',
  })
  message: string;
}
