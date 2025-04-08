import express, { Request, Response } from "express";
const Router = express.Router();
import {verifyRole} from "@middleware";
import {TransactionController} from '@controller';
import { Roles } from "@models/enums";


Router.post('/create', verifyRole([Roles.User]),TransactionController.initiatePayment as any);
Router.post('/webhook', verifyRole([Roles.User]),TransactionController.handleWebhook as any);

Router.get('/success', TransactionController.successPayment as any);
Router.get('/cancel', TransactionController.cancelPayment as any);


export default Router;