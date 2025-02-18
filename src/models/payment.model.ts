import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import  Booking  from './booking.model';

@Table({
  tableName: 'payments',
  timestamps: true,
})
export default class Payment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  paymentId!: string;

  @ForeignKey(() => Booking)
  @Column(DataType.UUID)
  bookingId!: string;

  @BelongsTo(() => Booking)
  booking!: Booking;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentMethod!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  paymentDate!: Date;
}
//done