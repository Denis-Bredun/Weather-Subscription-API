import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from './weather/weather.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TasksModule } from './tasks/tasks.module';
import dataSource from './config/ormconfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...dataSource.options,
    }),
    ScheduleModule.forRoot(),
    WeatherModule,
    SubscriptionModule,
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
