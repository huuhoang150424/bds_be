import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
	AllowNull
} from 'sequelize-typescript';
import User from './user.model';
import { ProcessingStatus ,PaymentMethod} from './enums';

@Table({ tableName: 'transactions', timestamps: true })
export default class Transaction extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  transactionId!: string;

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