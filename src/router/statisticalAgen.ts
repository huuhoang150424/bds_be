import express, { Request, Response } from "express";
import { verifyRole, paginationMiddleware} from "@middleware";
import {StatisticalAgenController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();

//Agen
Router.get('/getFeaturedPosts',verifyRole([Roles.Agent,Roles.User]),paginationMiddleware, StatisticalAgenController.getFeaturedPosts as any);
Router.get('/getViewByAddress',verifyRole([Roles.Agent,Roles.User]), StatisticalAgenController.getViewByAddress as any);
Router.get('/getPostByMonth',verifyRole([Roles.Agent,Roles.User]), StatisticalAgenController.getPostByMonth as any);
Router.get('/getTopSearchRegionsWithGrowth',verifyRole([Roles.Agent,Roles.User]), StatisticalAgenController.getTopSearchRegionsWithGrowth as any);
Router.get('/getRecentNewsCount',verifyRole([Roles.Agent,Roles.User]), StatisticalAgenController.getRecentNewsCount as any);
Router.get('/getDirectAccessCount',verifyRole([Roles.Agent,Roles.User]), StatisticalAgenController.getDirectAccessCount as any);


export default Router;
