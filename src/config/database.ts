import { Sequelize } from 'sequelize-typescript';
import "dotenv/config";
import {
	User,
	Post,
	Image,
	Message,
	News,
	Notification,
	PostHistory,
	Pricing,
	Rating,
	Report,
	Tag,
	TagPost,
	Transaction,
	Wishlist,
	UserPricing,
	Log,
	Comment,
	PropertyType,
	ListingType,
	PostDraft,
	NewsHistory,
	CommentLike,
	UserView,
	Banner,
	Appointment,
	AppointmentHistory
} from '@models/index';




export const sequelize = new Sequelize({
	database: process.env.DB_NAME!,
	dialect: 'mysql',
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	dialectOptions: {
		charset: 'utf8mb4',
	},
	define: {
		charset: 'utf8mb4',
		collate: 'utf8mb4_unicode_ci',
	},
	models: [
		//path.resolve(__dirname, '/models')
		User,
		Post,
		Image,
		Message,
		News,
		Notification,
		PostHistory,
		Pricing,
		Rating,
		Report,
		Tag,
		TagPost,
		Transaction,
		Wishlist,
		UserPricing,
		Log,
		Comment,
		PropertyType,
		ListingType,
		PostDraft,
		NewsHistory,
		CommentLike,
		UserView,
		Banner,
		Appointment,
		AppointmentHistory

	],
	logging: false,
});