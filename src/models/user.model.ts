
import { Table, Column, DataType, BeforeUpdate, Default, AllowNull, HasMany, BeforeCreate } from 'sequelize-typescript';
import { Post, PostDraft, Transaction, Comment, Rating, Wishlist, Report, Notification, News, CommentLike } from '@models';
import { Roles, Gender } from './enums';
import BaseModel from './base.model';
import bcrypt from 'bcrypt';

@Table({ 
  tableName: 'users', 
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_user_created_at',
      fields: ['created_at'],
    },
    {
      name: 'idx_user_fullname',
      fields: ['fullname'],
    },
  ],
})
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

  @Default(null)
  @Column({
    type: DataType.STRING,
    validate: {
      len: [10, 11],
      isNumeric: true,
    },
  })
  phone!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isProfessional!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  @Column({ type: DataType.DATE, defaultValue: null })
  lastActive!: Date | null;

  @Default(null)
  @Column(DataType.STRING)
  address!: string;

  @AllowNull(false)
  @Default(Gender.Other)
  @Column({ type: DataType.ENUM(...Object.values(Gender)) })
  gender!: Gender;

  @AllowNull(true)
  @Column(DataType.DATE)
  dateOfBirth!: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @Default("https://img.freepik.com/premium-vector/user-icons-includes-user-icons-people-icons-symbols-premiumquality-graphic-design-elements_981536-526.jpg")
  @Column(DataType.STRING)
  avatar!: string;

  @Default("https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/07/anh-bia-dep-10.jpg")
  @Column(DataType.STRING)
  coverPhoto!: string;

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

  @AllowNull(true)
  @Column(DataType.STRING)
  selfIntroduction!: string; 

	@Default('')
  @AllowNull(true)
  @Column(DataType.STRING)
  certificates!: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING
  })
  experienceYears!: string;

  @AllowNull(true)
  @Column(DataType.JSON)
  expertise!: string[]; 

  @Default(0)
  @Column(DataType.INTEGER)
  lockCount!: number;

  @Default(null)
  @Column(DataType.DATE)
  lockedAt!: Date | null; 

  @Default(null)
  @Column(DataType.DATE)
  unlockAt!: Date | null;

  @Default(null)
  @Column(DataType.DOUBLE)
  requiredUnlockAmount!: number | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isPermanentlyLocked!: boolean;

	@Default(null)
  @Column(DataType.STRING)
  twoFactorSecret!: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is2FAEnabled!: boolean;

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

  @HasMany(() => CommentLike)
  commentLikes!: CommentLike[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(user: User) {
    if (user.changed("password")) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  }

  // @BeforeUpdate
  // @BeforeCreate
  // static validateAgentFields(user: User) {
  //   if (user.roles === Roles.Agent) {
  //     if (!user.selfIntroduction || !user.experienceYears || !user.certificates || !user.expertise) {
  //       throw new Error('Agent must provide self-introduction, experience years, certificates, and expertise.');
  //     }
  //   }
  // }
}