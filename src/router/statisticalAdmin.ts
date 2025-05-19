import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalAdminController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();


// Admin
Router.get('/getUserDemographicStats',verifyRole([Roles.Admin]), StatisticalAdminController.getUserDemographicStats as any);
Router.get('/getTopUsersByPost',verifyRole([Roles.Admin]), StatisticalAdminController.getTopUsersByPost as any);
Router.get('/getMonthlyStats', verifyRole([Roles.Admin]), StatisticalAdminController.getMonthlyStats as any);
Router.get('/monthlyRevenueStats', verifyRole([Roles.Admin]), StatisticalAdminController.getMonthlyRevenueStats as any);
Router.get('/postDistributionStats', verifyRole([Roles.Admin]), StatisticalAdminController.getPostDistributionStats as any);
Router.get('/getMonthlyPropertyStats', verifyRole([Roles.Admin]), StatisticalAdminController.getMonthlyPropertyStats as any);

export default Router;
