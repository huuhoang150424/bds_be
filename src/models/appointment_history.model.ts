import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from "sequelize-typescript";
import { User, Appointment } from "@models";
import BaseModel from "./base.model";
import { AppointmentStatus, ActionType } from "./enums";

@Table({ tableName: "appointment_history", timestamps: false })
export default class AppointmentHistory extends BaseModel<string> {
  @ForeignKey(() => Appointment)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'appointment_id'
  })
  appointmentId!: string;

  @BelongsTo(() => Appointment, { onDelete: "SET NULL" })
  appointment!: Appointment;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'changed_by'
  })
  changedBy!: string;

  @BelongsTo(() => User, { foreignKey: "changedBy" })
  user!: User;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    allowNull: false,
    field: 'old_status'
  })
  oldStatus!: AppointmentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    allowNull: false,
    field: 'new_status'
  })
  newStatus!: AppointmentStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'change_reason'
  })
  changeReason?: string;

  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(ActionType)) })
  action!: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'changed_at'
  })
  changedAt!: Date;
}