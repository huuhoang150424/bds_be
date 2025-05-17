import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalAdminController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();


// Admin
Router.get('/getUserDemographicStats',verifyRole([Roles.Admin]), StatisticalAdminController.getUserDemographicStats as any);
Router.get('/getTopUsersByPost',verifyRole([Roles.Admin]), StatisticalAdminController.getTopUsersByPost as any);
Router.get('/getMonthlyStats', verifyRole([Roles.Admin]), StatisticalAdminController.getMonthlyStats as any);
Router.get('/monthly-revenue-stats', verifyRole([Roles.Admin]), StatisticalAdminController.getMonthlyRevenueStats as any);
Router.get('/post-distribution-stats', verifyRole([Roles.Admin]), StatisticalAdminController.getPostDistributionStats as any);

export default Router;
