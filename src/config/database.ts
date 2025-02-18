import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
  Payment,
  UserRole,
  SearchHistory,
  Log,
  Notification,
  Role,
} from '../models';

dotenv.config({ path: '.env.local' });

console.log(path.resolve(__dirname));

export const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  dialect: 'mysql',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  models: [
    //path.resolve(__dirname, '/models')
    User,
    Payment,
    Image,
    UserRole,
    SearchHistory,
    Log,
    Notification,
    Role,
  ],
  logging: false,
});
