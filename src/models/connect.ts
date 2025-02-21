import { sequelize } from "../config/database";

export const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connected successfully");
		// await sequelize.sync({ force: true })
		// console.log(" migrate successfully");
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
};