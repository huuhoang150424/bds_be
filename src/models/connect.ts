import { sequelize } from "@config/database";
import {seedUsers,seedPricings,seedListingTypes,seederPost,seedComments,seedWishlists,seedUserViews} from './seeders';

export const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connected successfully");
		await sequelize.sync({ force: true })
		await seedUsers();
		await seedPricings();
		await seedListingTypes();
		await seederPost();
		await seedComments();
		await seedWishlists();
		await seedUserViews();
		console.log(" migrate successfully");

	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
};