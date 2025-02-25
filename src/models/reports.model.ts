import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
	AllowNull
} from 'sequelize-typescript';
import User from './user.model';
import Post from './post.model';
import { ReportReason ,ProcessingStatus} from './enums';
import BaseModel from './base.model';


@Table({ tableName: 'reports', timestamps: true })
export default class Report extends BaseModel<string> {
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Post)
  @Column(DataType.UUID)
  postId!: string;

  @BelongsTo(() => Post)
  post!: Post;

	@AllowNull(false)
	@Column({type: DataType.ENUM(...Object.values(ReportReason))})
	reason!: ReportReason; 

  @Column(DataType.STRING)
  content!: string;

  @Column({type: DataType.ENUM(...Object.values(ProcessingStatus))})
  status!: string;
}
//done