import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import {PricingController} from '@controller';


Router.post('/buyPricing', verifyRole(['User','Agent']),PricingController.buyPricing as any);
Router.put('/updatePricing', verifyRole(['User','Agent']),PricingController.updatePricing as any);

export default Router;