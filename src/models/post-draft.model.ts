import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  BeforeCreate,
	BeforeUpdate,
  HasMany,
  Default
} from 'sequelize-typescript';
import slugify from 'slugify';

import {User,PropertyType,Image,TagPost} from '@models';
import { Directions, StatusPostDraft } from '@models/enums';
import BaseModel from './base.model';

@Table({ tableName: 'post_drafts', timestamps: true })
export default class PostDraft extends BaseModel<number> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Default('')
  @Column(DataType.STRING)
  slug!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  address!: string;

  @AllowNull(false)
  @Column(DataType.DOUBLE)
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  squareMeters!: number;

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

  @Column({ type: DataType.ENUM(...Object.values(Directions)) })
  direction!: string;

  @AllowNull(true)
  @Default(0)
  @Column(DataType.INTEGER)
  priority!: number;

  @Default(StatusPostDraft.DRAFT)
  @Column({ type: DataType.ENUM(...Object.values(StatusPostDraft)) })
  status!: string;

  @HasMany(() => Image)
  images!: Image[];

  @HasMany(() => TagPost)
  tagPosts!: TagPost[];

  @HasMany(() => PropertyType)
  propertyType!: PropertyType[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: PostDraft) {
    if (instance.title ) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
    }
  }
}
//done