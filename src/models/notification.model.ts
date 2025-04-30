import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
	Default,
  AllowNull,
} from 'sequelize-typescript';
import User from './user.model';
import BaseModel from './base.model';

@Table({ tableName: 'notifications', timestamps: true })
export default class Notification extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  message!: string;

  @Default(1)
  @Column(DataType.INTEGER)
  priority!: number;

	@Default(false)
  @Column(DataType.BOOLEAN)
  isRead!: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE, allowNull: false })
  endDate!: Date;

}
//done