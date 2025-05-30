import { sequelize } from "@config/database";
import {seedUsers,seedPricings,seedListingTypes,seederPost,seedComments,seedWishlists,seedUserViews,seedNews, seedPostHistory,seedCommentLikes, seedReport, seedRatings,seedBanners, seedNotifications, seedTransactions, seedUserPricings, seedAppointments} from './seeders';
import { seedProfessionalUsers } from "./seeders/professional";

export const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connected successfully");
		// await sequelize.sync({ force: true })
		// await seedUsers();
		// await seedPricings();
		// await seedListingTypes();
		// await seederPost();
		// await seedComments();
		// await seedUserViews();
		// await seedReport();
		// await seedNews();
		// await seedPostHistory();
		// await seedCommentLikes();
		// await seedRatings();
		// await seedWishlists();
		// await seedBanners();
		// await seedNotifications();
		// await seedTransactions();
		// await seedUserPricings();
		// await seedProfessionalUsers();
		// await seedAppointments();
		// console.log(" migrate successfully");
		
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
};