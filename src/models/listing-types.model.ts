import { Table, Column, DataType, HasMany, AllowNull, Default, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import BaseModel from './base.model';
import PropertyType from './property-types.model';
import { ListingTypes } from './enums';
import slugify from 'slugify';

@Table({ tableName: 'listing_types', timestamps: true })
export default class ListingType extends BaseModel<string> {
  @Column(DataType.STRING)
  listingType!: string;

  @AllowNull(false)
  @Default('')
  @Column(DataType.STRING)
  slug!: string;

  @HasMany(() => PropertyType)
  propertyType!: PropertyType[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: ListingType) {
    if (instance.listingType) {
      instance.slug = slugify(instance.listingType, { lower: true, strict: true });
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static validateAndSlugify(instance: ListingType) {
    const allowedValues = Object.values(ListingTypes) as string[];

    if (!allowedValues.includes(instance.listingType)) {
      console.warn(`Warning: "${instance.listingType}" không nằm trong enum ListingTypes`);
    }

    instance.slug = slugify(instance.listingType, { lower: true, strict: true });
  }
}
