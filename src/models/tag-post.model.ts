import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull
} from 'sequelize-typescript';
import {Post,PostDraft,Tag} from '@models';
import BaseModel from './base.model';

@Table({ tableName: 'tag_posts', timestamps: true })
export default class TagPost extends BaseModel<string> {
  @ForeignKey(() => Tag)
  @Column(DataType.UUID)
  tagId!: string;

  @BelongsTo(() => Tag)
  tag!: Tag;

  @AllowNull(true)
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post,{ onDelete: 'SET NULL' })
  post!: Post;

  @AllowNull(true)
  @ForeignKey(() => PostDraft)
  @Column(DataType.UUID)
  postDraftId!: string;

  @BelongsTo(() => PostDraft,{ onDelete: 'SET NULL' })
  postDraft!: PostDraft;
}
//done