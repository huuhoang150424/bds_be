import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
	AllowNull
} from 'sequelize-typescript';
import User from './user.model';
import Post from './post.model';
import { ReportReason ,ProcessingStatus} from './enums';


@Table({ tableName: 'reports', timestamps: true })
export default class Report extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  reportId!: string;

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