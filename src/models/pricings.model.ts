import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
	HasMany
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
  @Column(DataType.INTEGER)
  priority!: number;

  @AllowNull(false)
  @Column(DataType.DOUBLE)
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  expiredDay!: number;

	@HasMany(() => UserPricing)
	userPricings!: UserPricing[];

}
//done