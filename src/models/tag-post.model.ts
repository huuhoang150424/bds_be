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
import Tag from './tag.model';
import Post from './post.model';

@Table({ tableName: 'tag_posts', timestamps: true })
export default class TagPost extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  tagPostId!: string;

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