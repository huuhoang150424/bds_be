import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import User from './user.model';
import Post from './post.model';
import BaseModel from './base.model';

@Table({ tableName: 'wishlists', timestamps: true })
export default class Wishlist extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(true)
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post,{ onDelete: 'SET NULL' })
  post!: Post;
}
//done