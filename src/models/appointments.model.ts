import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
} from "sequelize-typescript";
import User from "./user.model";
import Post from "./post.model";
import BaseModel from "./base.model";
import { AppointmentStatus } from "./enums";

@Table({ tableName: "appointments", timestamps: true })
export default class Appointment extends BaseModel<string> {
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post, { onDelete: "CASCADE" })
  post!: Post;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  requesterId!: string;

  @BelongsTo(() => User, { foreignKey: "requesterId" })
  requester!: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  receiverId!: string;

  @BelongsTo(() => User, { foreignKey: "receiverId" })
  receiver!: User;

  @Column(DataType.DATE)
  appointmentTime!: Date;

  @Default(30) 
  @Column(DataType.INTEGER)
  duration!: number;

  @Default("pending")
  @Column({ type: DataType.ENUM(...Object.values(AppointmentStatus)) })
  status!: AppointmentStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  message?: string;
}
