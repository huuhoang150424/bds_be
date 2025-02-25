import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Tag from './tag.model';
import Post from './post.model';
import BaseModel from './base.model';

@Table({ tableName: 'tag_posts', timestamps: true })
export default class TagPost extends BaseModel<string> {
  @ForeignKey(() => Tag)
  @Column(DataType.UUID)
  tagId!: string;

  @BelongsTo(() => Tag)
  tag!: Tag;

  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;
}
//done