import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import User from './user.model';
import Pricing from './pricings.model';
import BaseModel from './base.model';

@Table({ tableName: 'user_pricings', timestamps: true })
export default class UserPricing extends BaseModel<string> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Pricing)
  @AllowNull(true)
  @Column(DataType.UUID)
  pricingId!: string;

  @BelongsTo(() => Pricing)
  pricing!: Pricing;

  @Default(15) 
  @Column(DataType.INTEGER)
  remainingPosts!: number;

	@Default(10)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  displayDay!: number;

  @AllowNull(false)
  @Default(DataType.NOW) 
  @Column(DataType.DATE)
  startDate!: Date;

  @Default(0) 
  @Column(DataType.INTEGER)
  boostDays!: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  endDate!: Date;
}
