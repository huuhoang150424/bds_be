import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import {Post,PostDraft} from '@models';
import BaseModel from './base.model';

@Table({ tableName: 'images', timestamps: true })
export default class Image extends BaseModel<string> {
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

  @Column(DataType.STRING)
  imageUrl!: string;
}
//done