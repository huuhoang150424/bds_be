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

  @Default(1)
  @Column(DataType.INTEGER)
  level!: number;

	@Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('likeCount') || 0;
    },
  })
  likeCount!: number;

	@Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('dislikeCount') || 0;
    },
  })
  dislikeCount!: number;


	@Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('liked') || false;
    },
  })
  liked!: boolean;

	@Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('disliked') || false;
    },
  })
  disliked!: boolean;

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

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  parentId!: string | null; 

  @BelongsTo(() => Comment, { onDelete: 'CASCADE' })
  parentComment!: Comment;

  @HasMany(() => Comment, { foreignKey: 'parentId', as: 'replies' })
  replies!: Comment[];
}
//done