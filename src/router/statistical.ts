import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();


Router.get('/getViewByAddress',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getViewByAddress as any);
Router.get('/getPostByMonth',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getPostByMonth as any);
Router.get('/getTopSearchRegionsWithGrowth',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getTopSearchRegionsWithGrowth as any);
Router.get('/getRecentNewsCount',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getRecentNewsCount as any);

// Admin
Router.get('/getUserAgeStatistics',verifyRole([Roles.Admin]), StatisticalController.getUserAgeStatistics as any);
Router.get('/getTopUsersByPost',verifyRole([Roles.Admin]), StatisticalController.getTopUsersByPost as any);
export default Router;
