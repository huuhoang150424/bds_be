import { sequelize } from "@config/database";
import {seedUsers,seedPricings,seedListingTypes,seederPost} from './seeders';

export const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connected successfully");
		// await sequelize.sync({ force: true })
		// await seedUsers();
		// await seedPricings();
		// await seedListingTypes();
		// await seederPost();
		// console.log(" migrate successfully");

	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
};