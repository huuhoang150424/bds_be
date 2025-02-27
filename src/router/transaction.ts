import express, { Request, Response } from "express";
const Router = express.Router();
import {verifyRole} from "@middleware";
import {TransactionController} from '@controller';


Router.post('/create', verifyRole(['User']),TransactionController.initiatePayment as any);
Router.post('/webhook', verifyRole(['User']),TransactionController.handleWebhook as any);

Router.get('/success', TransactionController.successPayment as any);
Router.get('/cancel', TransactionController.cancelPayment as any);


export default Router;