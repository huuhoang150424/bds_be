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
import User  from './user.model';

@Table({
  tableName: 'search_history',
  timestamps: false,
})
export default class SearchHistory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  searchId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  searchQuery!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  searchDate!: Date;
}
//done