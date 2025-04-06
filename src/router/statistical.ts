import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {StatisticalController} from '@controller';
const Router = express.Router();

Router.get('/getViewByAddress',verifyRole(["Agent","User"]), StatisticalController.getViewByAddress as any);


export default Router;
