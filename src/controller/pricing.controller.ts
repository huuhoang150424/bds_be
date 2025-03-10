'use-strict';

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from "@helper";
import { PricingService } from "@service";

class PricingController {
	//[create pricing]
	static async buyPricing(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
		const { pricingId } = req.body;
		try {
			const newPricing = await PricingService.buyPricing(userId, pricingId);
			return res.status(201).json(
				ApiResponse.success(newPricing, "Mua gói thành công!")
			);
		} catch (error) {
			next(error);
		}
	}
	//[update Pricing]
	static async updatePricing(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
		const { pricingId } = req.body;
		try {
			const newPricing = await PricingService.updatePricing(userId, pricingId);
			return res.status(200).json(
				ApiResponse.success(newPricing, "Nâng cấp gói Vip thành công!")
			);
		} catch (error) {
			next(error);
		}
	}
}


export default PricingController;