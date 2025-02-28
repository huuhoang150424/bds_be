'use-strict';

import { Request, Response, NextFunction } from 'express';
import {ApiResponse} from "@helper";
import {PricingService} from "@service";

class PricingController {

	static async buyPricing(req: Request, res: Response, next: NextFunction){
		try {
			const userId=(req as any).user.userId;
			const {pricingId}=req.body;
			const newPricing = await PricingService.buyPricing(userId,pricingId);
			return res.status(201).json(
				ApiResponse.success(newPricing, "Mua gói thành công!")
			);
		} catch (error) {
			next(error);
		}
	}

}


export default PricingController;