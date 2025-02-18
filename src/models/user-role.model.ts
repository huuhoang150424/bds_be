import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import  User  from './user.model';
import  Role  from './role.model';

@Table({
  tableName: 'user_roles',
  timestamps: false,
})
export default class UserRole extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  userRoleId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Role)
  @Column(DataType.UUID)
  roleId!: string;

  @BelongsTo(() => Role)
  role!: Role;
}
//done