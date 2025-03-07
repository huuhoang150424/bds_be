import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default
} from 'sequelize-typescript';
import {User,Post,CommentLike} from "@models";
import BaseModel from './base.model';
import { CommentStatus } from './enums';

@Table({ tableName: 'comments', timestamps: true })
export default class Comment extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user!: User;

  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post, { onDelete: 'SET NULL' })
  post!: Post;

  @Column(DataType.TEXT)
  content!: string;

  @HasMany(() => CommentLike)
  likes!: CommentLike[];

  @Default(CommentStatus.ACTIVE)
  @Column({ type: DataType.ENUM(...Object.values(CommentStatus)) })
  status!: CommentStatus;
}
//done