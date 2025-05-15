import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherModule } from './weather/weather.module';
import { SubscriptionModule } from './subscription/subscription.module';
import dataSource from './config/ormconfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...dataSource.options,  
    }),
    WeatherModule,
    SubscriptionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
