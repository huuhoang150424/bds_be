import { sequelize } from "../config/database";

export const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connected successfully");
		// await sequelize.sync({ alter: true })
		// console.log(" migrate successfully");
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
};