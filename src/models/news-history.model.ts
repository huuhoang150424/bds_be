import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt
} from "sequelize-typescript";
import News from "./news.model";
import User from "./user.model";
import { CategoryNew, Roles, HistoryNews } from "./enums";

@Table({
  tableName: "news_history",
  timestamps: false, 
})
export default class NewsHistory extends Model {
  @ForeignKey(() => News)
  @Column(DataType.UUID)
  newsId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @Column({ type: DataType.ENUM(...Object.values(Roles)) })
  createdBy!: Roles;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.TEXT)
  origin_post!: string;

  @Column(DataType.STRING)
  imageUrl!: string;

  @Column({ type: DataType.ENUM(...Object.values(CategoryNew)) })
  category!: CategoryNew;

  @Column(DataType.INTEGER)
  readingTime!: number;

  @Column({ type: DataType.ENUM(...Object.values(HistoryNews)) })
  action!: HistoryNews;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => News, { foreignKey: "newsId", as: "news" })
  news!: News;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user!: User;
}
