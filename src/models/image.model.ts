import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import Post from './post.model';
import BaseModel from './base.model';

@Table({ tableName: 'images', timestamps: true })
export default class Image extends BaseModel<string> {
  @AllowNull(true)
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post,{ onDelete: 'SET NULL' })
  post!: Post;

  @Column(DataType.STRING)
  imageUrl!: string;
}
//done