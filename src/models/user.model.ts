import { Table, Column, DataType, BeforeUpdate, Default, AllowNull, HasMany,BeforeCreate } from 'sequelize-typescript';
<<<<<<< HEAD
import Post from './post.model';
import Transaction from './transactions.model';
import Comment from './comment.model';
import Rating from './rating.model';
import Wishlist from './wish-list.model';
import Report from './reports.model';
import Notification from './notification.model';
import News from './news.model';
=======

import {Post,PostDraft,Transaction,Comment,Rating,Wishlist,Report,Notification,News} from '@models';
>>>>>>> 89ef71cb1a3c3b5e8aa4291f5e3548d148189ed8
import { Roles } from './enums';
import BaseModel from './base.model';
import bcrypt from 'bcrypt';

@Table({ tableName: 'users', timestamps: true })
export default class User extends BaseModel<string> {
  @AllowNull(false)
  @Column(DataType.STRING)
  fullname!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  emailVerified!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isLock!: boolean;

  @Column(DataType.STRING)
  phone!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

	@Default("https://img.freepik.com/premium-vector/user-icons-includes-user-icons-people-icons-symbols-premiumquality-graphic-design-elements_981536-526.jpg")
  @Column(DataType.STRING)
  avatar!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DOUBLE)
  balance!: number;

  @AllowNull(false)
	@Default(Roles.User)
  @Column({ type: DataType.ENUM(...Object.values(Roles)) })
  roles!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  score!: number;

  @HasMany(() => Post)
  posts!: Post[];

  @HasMany(() => Transaction)
  transactions!: Transaction[];

  @HasMany(() => Comment)
  comments!: Comment[];

  @HasMany(() => Rating)
  ratings!: Rating[];

  @HasMany(() => Wishlist)
  wishlist!: Wishlist[];

  @HasMany(() => News)
  new!: News[];

  @HasMany(() => Report)
  reports!: Report[];

  @HasMany(() => Notification)
  notifications!: Notification[];

  @HasMany(() => PostDraft)
  postDrafts!: PostDraft[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(user: User) {
    if (user.changed("password")) { 
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  }
}
