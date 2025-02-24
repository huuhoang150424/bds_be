import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import TagPost from './tag-post.model';
import BaseModel from './base.model';

@Table({ tableName: 'tags', timestamps: true })
export default class Tag extends BaseModel<string> {
  @Column(DataType.STRING)
  tagName!: string;

  @HasMany(() => TagPost)
  tagPosts!: TagPost[];
}

//done