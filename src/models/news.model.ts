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
  BeforeCreate,
  BeforeUpdate
} from 'sequelize-typescript';
import User from './user.model';
import { CategoryNew } from './enums';
import BaseModel from './base.model';
import slugify from 'slugify';

@Table({
  tableName: 'news',
  timestamps: true,
})
export default class News extends BaseModel<string> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  view!: number;

  @AllowNull(false)
  @Default('')
  @Column(DataType.STRING)
  slug!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  imageUrl!: string;

  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(CategoryNew)) })
  category!: CategoryNew;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  readingTime!: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'author' })
  author!: User;

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: News) {
    if (instance.title && !instance.slug) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
    }
  }
}
