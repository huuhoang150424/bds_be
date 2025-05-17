import express, { Request, Response } from "express";
import { verifyRole, paginationMiddleware} from "@middleware";
import {StatisticalController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();

//Agen
Router.get('/getFeaturedPosts',verifyRole([Roles.Agent,Roles.User]),paginationMiddleware, StatisticalController.getFeaturedPosts as any);
Router.get('/getViewByAddress',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getViewByAddress as any);
Router.get('/getPostByMonth',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getPostByMonth as any);
Router.get('/getTopSearchRegionsWithGrowth',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getTopSearchRegionsWithGrowth as any);
Router.get('/getRecentNewsCount',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getRecentNewsCount as any);
Router.get('/getDirectAccessCount',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getDirectAccessCount as any);


// Admin
Router.get('/getUserAgeStatistics',verifyRole([Roles.Admin]), StatisticalController.getUserAgeStatistics as any);
Router.get('/getTopUsersByPost',verifyRole([Roles.Admin]), StatisticalController.getTopUsersByPost as any);
Router.get('/getMonthlyStats', verifyRole([Roles.Admin]), StatisticalController.getMonthlyStats as any);

export default Router;
