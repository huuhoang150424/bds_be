import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
	AllowNull,
  Default
} from 'sequelize-typescript';
import User from './user.model';
import Post from './post.model';
import { ReportReason ,ProcessingStatus, SeverityStatus} from './enums';
import BaseModel from './base.model';


@Table({ tableName: 'reports', timestamps: true })
export default class Report extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(true)
  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post,{ onDelete: 'SET NULL' })
  post!: Post;

	@AllowNull(false)
	@Column({type: DataType.ENUM(...Object.values(ReportReason))})
	reason!: ReportReason; 

  @Column(DataType.STRING)
  content!: string;

  @Column({type: DataType.ENUM(...Object.values(ProcessingStatus))})
  status!: string;

  @Default(SeverityStatus.Urgent)
  @Column({type: DataType.ENUM(...Object.values(SeverityStatus))})
  severity!: string;
}
//done