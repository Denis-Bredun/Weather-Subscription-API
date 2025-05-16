import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import { WeatherService } from '../weather/weather.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [TasksService, WeatherService],
})
export class TasksModule {}
