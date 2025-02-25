import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import ListingType from './listing-types.model';
import Post from './post.model';
import BaseModel from './base.model';

@Table({ tableName: 'property_types', timestamps: true })
export default class PropertyType extends BaseModel<string> {
  @ForeignKey(() => ListingType)
  @Column({ type: DataType.UUID, allowNull: false })
  listingTypeId!: string;

  @BelongsTo(() => ListingType)
  listingType!: ListingType;

	@ForeignKey(() => Post)
  @Column({ type: DataType.UUID, allowNull: false })
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;
}
