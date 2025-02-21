import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';
import { CategoryNew } from './enums';

@Table({
  tableName: 'news',
  timestamps: true,
})
export default class News extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  newsId!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string; 

  @AllowNull(false)
  @Column(DataType.STRING)
  createdBy!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string; 

  @AllowNull(true)
  @Column(DataType.STRING)
  imageUrl!: string; 

  @AllowNull(false)
  @Column({type: DataType.ENUM(...Object.values(CategoryNew))})
  category!: CategoryNew; 

  @AllowNull(true)
  @Column(DataType.INTEGER)
  readingTime!: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'author' })
  author!: User;
}
