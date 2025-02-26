import {
  Table,
  Column,
  DataType,
  AllowNull,
  HasMany,
  Default,
} from 'sequelize-typescript';
import UserPricing from './user-pricing.model';
import BaseModel from './base.model';

@Table({
  tableName: 'pricings',
  timestamps: true,
})
export default class Pricing extends BaseModel<string> {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.DOUBLE)
  price!: number;

  @Default(0)
  @Column(DataType.DOUBLE)
  discountPercent!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  displayDay!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  hasReport!: boolean;

  @Default(0) 
  @Column(DataType.INTEGER)
  maxPost!: number;

  @Default(0) 
  @Column(DataType.INTEGER)
  boostDays!: number;

  @AllowNull(false)
  @Default(30) 
  @Column(DataType.INTEGER)
  expiredDay!: number;

  @HasMany(() => UserPricing)
  userPricings!: UserPricing[];
}
//done