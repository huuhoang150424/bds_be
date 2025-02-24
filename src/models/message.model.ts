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
import BaseModel from './base.model';

@Table({
  tableName: 'messages',
  timestamps: true,
})
export default class Message extends BaseModel<string> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  senderId!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  receiverId!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isRead!: boolean; 

  @BelongsTo(() => User, { foreignKey: 'senderId', as: 'sender' })
  sender!: User;

  @BelongsTo(() => User, { foreignKey: 'receiverId', as: 'receiver' })
  receiver!: User;
}
//done
