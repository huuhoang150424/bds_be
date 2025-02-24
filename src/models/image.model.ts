import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Post from './post.model';
import BaseModel from './base.model';

@Table({ tableName: 'images', timestamps: true })
export default class Image extends BaseModel<string> {
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;

  @Column(DataType.STRING)
  imageUrl!: string;
}
//done