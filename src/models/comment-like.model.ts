import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Unique,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import User from './user.model';
import Comment from './comment.model';
import BaseModel from './base.model';
import { LikeStatus } from './enums';

@Table({ tableName: 'comment_likes', timestamps: true })
export default class CommentLike extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  user!: User;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  commentId!: string;

  @BelongsTo(() => Comment, { onDelete: 'SET NULL' })
  comment!: Comment;

  @AllowNull(false)
  @Default(LikeStatus.LIKE)
  @Column({ type: DataType.ENUM(...Object.values(LikeStatus)) })
  status!: LikeStatus;
}
