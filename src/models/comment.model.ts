import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import {User,Post,CommentLike} from "@models";
import BaseModel from './base.model';

@Table({ tableName: 'comments', timestamps: true })
export default class Comment extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;

  @Column(DataType.TEXT)
  content!: string;

  @HasMany(() => CommentLike)
  likes!: CommentLike[];
}
//done