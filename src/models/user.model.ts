import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Booking  from './booking.model';
import Review  from './review.model';
import SearchHistory  from './search-history.model';
import Log  from './logs.model';
import Notification  from './notification.model';
import  UserRole from './user-role.model';


@Table({
  tableName: 'users',
  timestamps: true,
})
export default class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  phone!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @HasMany(() => Booking)
  bookings!: Booking[];

  @HasMany(() => Review)
  reviews!: Review[];

	@HasMany(() => UserRole)
  user_roles!: UserRole[];

  @HasMany(() => Log)
  logs!: Log[];

	@HasMany(() => Notification)
  notifications!: Notification[];

  @HasMany(() => SearchHistory)
  searchHistories!: SearchHistory[];
}