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
  import { CategoryNew } from './enums';
  
  @Table({
    tableName: "news_history",
    timestamps: false, // Không cần `updatedAt` vì chỉ lưu khi có thay đổi
  })
  export default class NewsHistory extends Model {
    @ForeignKey(() => News)
    @Column(DataType.UUID)
    newsId!: string;
  
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
  
    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;
  
    @BelongsTo(() => News, { foreignKey: "newsId", as: "news" })
    news!: News;
  }
  