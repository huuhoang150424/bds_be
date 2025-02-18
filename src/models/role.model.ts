import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  HasMany,
} from 'sequelize-typescript';
import  UserRole  from './user-role.model';

@Table({
  tableName: 'roles',
  timestamps: false,
})
export default class Role extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  roleId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  roleName!: string;

  @HasMany(() => UserRole)
  userRoles!: UserRole[];
}
//done