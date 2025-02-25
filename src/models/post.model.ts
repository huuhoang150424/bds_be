import {
  Table,
  Column,
  DataType,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
	BeforeCreate,
	BeforeUpdate
} from 'sequelize-typescript';
import slugify from 'slugify';
import User from './user.model';
import Image from './image.model';
import Comment from './comment.model';
import Rating from './rating.model';
import Wishlist from './wish-list.model';
import Report from './reports.model';
import TagPost from './tag-post.model';
import BaseModel from './base.model';
import PropertyType from './property-types.model';

import { ListingTypes, Directions, PriceUnit, StatusPost } from './enums';

@Table({ tableName: 'posts', timestamps: true })
export default class Post extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.DOUBLE)
  price!: number;

  @Column(DataType.INTEGER)
  square_meters!: number;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.INTEGER)
  floor!: number;

  @Column(DataType.INTEGER)
  bedroom!: number;

  @Column(DataType.INTEGER)
  bathroom!: number;

	@Default(0)
	@Column(DataType.INTEGER)
  priority!: number;

  @Column(DataType.BOOLEAN)
  isFurniture!: boolean;

  @Column(DataType.ENUM(...Object.values(Directions)))
  direction!: string;

  @Column(DataType.BOOLEAN)
  verified!: boolean;

  @Column(DataType.DATE)
  expiredDate!: Date;

  @Column(DataType.DATE)
  expiredBoost!: Date;

  @Column(DataType.ENUM(...Object.values(StatusPost)))
  status!: 'Còn trống' | 'Đang đám phán' | 'Đã bàn giao';

	@AllowNull(false)
  @Column(DataType.STRING)
  slug!: string;

  @HasMany(() => Image)
  images!: Image[];

  @HasMany(() => Comment)
  comments!: Comment[];

  @HasMany(() => Rating)
  ratings!: Rating[];

  @HasMany(() => Wishlist)
  wishlists!: Wishlist[];

  @HasMany(() => Report)
  reports!: Report[];

  @HasMany(() => TagPost)
  tagPosts!: TagPost[];

	@HasMany(() => PropertyType)
  propertyType!: PropertyType[];

	@BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Post) {
    if (instance.title) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
    }
  }
}
//done
