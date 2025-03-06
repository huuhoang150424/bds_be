import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Unique,
} from 'sequelize-typescript';
import User from './user.model';
import Comment from './comment.model';
import BaseModel from './base.model';

@Table({ tableName: 'comment_likes', timestamps: true })
export default class CommentLike extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  commentId!: string;

  @BelongsTo(() => Comment)
  comment!: Comment;

}
