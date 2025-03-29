import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
	AllowNull,
} from 'sequelize-typescript';
import User from './user.model'; 
import Post from './post.model';
import BaseModel from './base.model'; 

@Table({ tableName: 'user_views', timestamps: false }) 
export default class UserView extends BaseModel<string> {

  @ForeignKey(() => User)
	@AllowNull(true)
	@Column(DataType.UUID)
  userId!: number;

  @BelongsTo(() => User, { onDelete: 'SET NULL' })

  user!: User; 

  @ForeignKey(() => Post)
	@AllowNull(true)
  @Column(DataType.UUID)
  postId!: number;

  @BelongsTo(() => Post, { onDelete: 'SET NULL' })
  post!: Post;

  @Column(DataType.DATE)
  viewedAt!: Date; 
}