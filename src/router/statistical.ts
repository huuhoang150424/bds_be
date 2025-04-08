import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();

Router.get('/getViewByAddress',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getViewByAddress as any);
Router.get('/getPostByMonth',verifyRole([Roles.Agent,Roles.User]), StatisticalController.getPostByMonth as any);

export default Router;
