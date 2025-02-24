import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';
import BaseModel from './base.model';

@Table({ tableName: 'notifications', timestamps: true })
export default class Notification extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  message!: string;

  @Column(DataType.BOOLEAN)
  isRead!: boolean;
}
//done