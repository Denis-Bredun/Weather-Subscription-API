import { DataSource } from 'typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Subscription],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
