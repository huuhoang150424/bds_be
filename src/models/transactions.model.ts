import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';
import { ProcessingStatus ,PaymentMethod} from './enums';
import BaseModel from './base.model';

@Table({ tableName: 'transactions', timestamps: true })
export default class Transaction extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.DOUBLE)
  amount!: number;

  @Column(DataType.STRING)
  description!: string;

  @Column({type: DataType.ENUM(...Object.values(ProcessingStatus))})
  paymentMethod!: string;

  @Column({type: DataType.ENUM(...Object.values(PaymentMethod))})
  status!: string;
}
//done