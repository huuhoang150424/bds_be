import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from "sequelize-typescript";
import News from "./news.model";
import User from "./user.model";
import { CategoryNew, Roles, ActionType } from "./enums";
import BaseModel from "./base.model";

@Table({ tableName: "news_history", timestamps: false })
export default class NewsHistory extends BaseModel<string> {
  @ForeignKey(() => News)
  @AllowNull(true)
  @Column(DataType.UUID)
  newsId!: string;

  @BelongsTo(() => News, { onDelete: "SET NULL" })
  news!: News;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User, { onDelete: "SET NULL" })
  user!: User;

  @Column({ type: DataType.ENUM(...Object.values(Roles)) })
  createdBy!: Roles;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  originPost!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  imageUrl!: string;

  @Column({ type: DataType.ENUM(...Object.values(CategoryNew)) })
  category!: CategoryNew;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  readingTime!: number;

  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(ActionType)) })
  action!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  changedAt!: Date;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  changeBy!: string | null;

  @BelongsTo(() => User, { foreignKey: "changeBy", onDelete: "SET NULL" })
  changedUser!: User;
}
