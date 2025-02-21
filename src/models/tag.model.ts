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

@Table({ tableName: 'tags', timestamps: true })
export default class Tag extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  tagId!: string;

  @Column(DataType.STRING)
  tagName!: string;

  @HasMany(() => TagPost)
  tagPosts!: TagPost[];
}

//done