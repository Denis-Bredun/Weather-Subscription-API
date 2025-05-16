import { IsEmail, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeRequestDto {
  @ApiProperty({
    description: 'User email address for receiving weather updates',
    example: 'boris.dmitrovich@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Name of the city for which the user wants the forecast',
    example: 'Berlin',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Frequency of weather updates',
    enum: ['daily', 'hourly'],
    example: 'daily',
  })
  @IsIn(['daily', 'hourly'])
  frequency: 'daily' | 'hourly';
}
