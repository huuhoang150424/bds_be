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
import  User  from './user.model';

@Table({
  tableName: 'notifications',
  timestamps: true,
})
export default class Notification extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  notificationId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;
}
//done