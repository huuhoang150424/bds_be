import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import User from './user.model';
import Pricing from './pricings.model';

@Table({ tableName: 'user_pricings', timestamps: true })
export default class UserPricing extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  user_pricing_id!: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Pricing)
  @AllowNull(false)
  @Column(DataType.UUID)
  pricing_id!: string;

  @BelongsTo(() => Pricing)
  pricing!: Pricing;

  @AllowNull(false)
  @Column(DataType.DATE)
  start_date!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  end_date!: Date;
}
//done