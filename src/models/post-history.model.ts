import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import User from './user.model';
import Post from './post.model';
import { PriceUnit, ListingTypes, PropertyType, Directions, StatusPost } from './enums';
import BaseModel from './base.model';

@Table({ tableName: 'post_history', timestamps: false })
export default class PostHistory extends BaseModel<string> {
  @ForeignKey(() => Post)
  @AllowNull(false)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string; 

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.ENUM(...Object.values(PriceUnit)) })
  priceUnit!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  address!: string;

  @AllowNull(false)
  @Column(DataType.DOUBLE)
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  square_meters!: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  floor!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  bedroom!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  bathroom!: number;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  isFurniture!: boolean;

	@AllowNull(false)
  @Column(DataType.STRING)
  slug!: string;

  @Column({ type: DataType.ENUM(...Object.values(Directions)) })
  direction!: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  verified!: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  expiredDate!: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  expiredBoost!: Date;

  @Column({ type: DataType.ENUM(...Object.values(StatusPost)) })
  status!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  changedAt!: Date;
}
