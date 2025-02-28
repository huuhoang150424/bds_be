import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import {PricingController} from '@controller';


Router.post('/buyPricing', verifyRole(['User']),PricingController.buyPricing as any);

export default Router;