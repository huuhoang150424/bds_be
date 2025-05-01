import express, { Request, Response } from 'express';
const Router = express.Router();
import { paginationMiddleware, verifyRole } from '@middleware';
import { PricingController } from '@controller';
import { Roles } from '@models/enums';

Router.post('/buyPricing', verifyRole([Roles.User, Roles.Agent]), PricingController.buyPricing as any);
Router.put('/updatePricing', verifyRole([Roles.User, Roles.Agent]), PricingController.updatePricing as any);
Router.get('/getAllPricing', verifyRole([Roles.Agent]), paginationMiddleware, PricingController.getAllPricing as any);
Router.post('/createPricing', verifyRole([Roles.Admin]), PricingController.createPricing as any);
Router.put('/:id/editPricing', verifyRole([Roles.Admin]), PricingController.editPricing as any);
Router.delete('/:id/deletePricing', verifyRole([Roles.Admin]), PricingController.deletePricing as any);
Router.post('/:id/stop',verifyRole([Roles.Admin]), PricingController.stopPricing as any);

export default Router;
