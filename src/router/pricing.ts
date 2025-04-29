import express, { Request, Response } from "express";
const Router = express.Router();
import { paginationMiddleware, verifyRole} from "@middleware";
import {PricingController} from '@controller';
import { Roles } from "@models/enums";


Router.post('/buyPricing', verifyRole([Roles.User,Roles.Agent]),PricingController.buyPricing as any);
Router.put('/updatePricing', verifyRole([Roles.User,Roles.Agent]),PricingController.updatePricing as any);
Router.get('/getAllPricing', verifyRole([Roles.Agent]),paginationMiddleware,PricingController.getAllPricing as any);
export default Router;