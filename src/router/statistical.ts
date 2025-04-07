import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalController} from '@controller';
const Router = express.Router();

Router.get('/getViewByAddress',verifyRole(["Agent","User"]), StatisticalController.getViewByAddress as any);
Router.get('/getPostByMonth',verifyRole(["Agent","User"]), StatisticalController.getPostByMonth as any);
Router.get('/getTopSearchRegionsWithGrowth',verifyRole(["Agent","User"]), StatisticalController.getTopSearchRegionsWithGrowth as any);

export default Router;
