import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from "sequelize-typescript";
import BaseModel from "./base.model";

@Table({ tableName: "banners", timestamps: true })
export default class Banner extends BaseModel<string> {
 
  @Column({ type: DataType.STRING, allowNull: false })
  title!: string;

  @AllowNull(true)
  @Column(DataType.JSON) 
  imageUrls!: string[];

  @Column({ type: DataType.STRING, allowNull: false })
  targetUrl!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  displayOrder!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  endDate!: Date;

}
