import {
  Table,
  Column,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import BaseModel from './base.model';
import PropertyType from './property-types.model';
import {  ListingTypes } from './enums';


@Table({ tableName: 'listing_types', timestamps: true })
export default class ListingType extends BaseModel<string> {
	@Column(DataType.ENUM(...Object.values(ListingTypes)))
	ListingType !: string;

	@HasMany(() => PropertyType)
	propertyType!: PropertyType[];
}
