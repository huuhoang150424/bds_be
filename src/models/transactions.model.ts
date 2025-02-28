import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
	AllowNull,
} from 'sequelize-typescript';
import User from './user.model';
import { Status ,PaymentMethod} from './enums';
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

	@AllowNull(true)
	@Column(DataType.INTEGER)
  orderCode!: number;

  @Column({type: DataType.ENUM(...Object.values(PaymentMethod))})
  paymentMethod!: string;

  @Column({type: DataType.ENUM(...Object.values(Status))})
  status!: string;
}
//done