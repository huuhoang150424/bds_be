import {
  Table,
  Column,
  DataType,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';
import BaseModel from './base.model';

@Table({
  tableName: 'logs',
  timestamps: true,
})
export default class Log extends BaseModel<string> {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  action!: string; 

  @AllowNull(true)
  @Column(DataType.TEXT)
  details!: string; 

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => User)
  user!: User;
}
//done