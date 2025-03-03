import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';

import {Post,PostDraft,ListingType} from '@models';
import BaseModel from './base.model';

@Table({ tableName: 'property_types', timestamps: true })
export default class PropertyType extends BaseModel<string> {
  @AllowNull(false)
  @ForeignKey(() => ListingType)
  @Column({ type: DataType.UUID})
  listingTypeId!: string;

  @BelongsTo(() => ListingType)
  listingType!: ListingType;

  @AllowNull(true)
	@ForeignKey(() => Post)
  @Column({ type: DataType.UUID })
  postId!: string;

  @BelongsTo(() => Post,{ onDelete: 'SET NULL' })
  post!: Post;

  @AllowNull(true)
  @ForeignKey(() => PostDraft)
  @Column(DataType.UUID)
  postDraftId!: string;

  @BelongsTo(() => PostDraft,{ onDelete: 'SET NULL' })
  postDraft!: PostDraft;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;
}
