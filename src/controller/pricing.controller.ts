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
	static async getAllPricing(req: Request, res: Response, next: NextFunction) {
		const { page, limit, offset } = (req as any).pagination;
		try {
			const pricings=await PricingService.getAllPricing(page, limit, offset);
			return res.status(200).json(
				ApiResponse.success(pricings, "Thành công!")
			);
		} catch (error) {
			next(error);
		}
	}

	// [Create Pricing]
	static async createPricing(req: Request, res: Response, next: NextFunction) {
    const pricingData = req.body;
    try {
      const newPricing = await PricingService.createPricing(pricingData);
      return res.status(201).json(
        ApiResponse.success(newPricing, 'Tạo gói thành công!')
      );
    } catch (error) {
      next(error);
    }
  }

  // [Update Pricing]
  static async editPricing(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const pricingData = req.body;
    try {
      const updatedPricing = await PricingService.editPricing(id, pricingData);
      return res.status(200).json(
        ApiResponse.success(updatedPricing, 'Cập nhật gói thành công!')
      );
    } catch (error) {
      next(error);
    }
  }

  // [Delete Pricing]
  static async deletePricing(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await PricingService.deletePricing(id);
      return res.status(200).json(
        ApiResponse.success(null, 'Xóa gói thành công!')
      );
    } catch (error) {
      next(error);
    }
  }


	static async stopPricing(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const result = await PricingService.stopPricing(id);
      return res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

	static async getPurchasedPricings(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
		const { page, limit, offset } = (req as any).pagination;
    try {
      const purchasedPricings = await PricingService.getPurchasedPricings(
        userId,
        page,
        limit
      );
      return res.status(200).json(
        ApiResponse.success(purchasedPricings, 'Lấy danh sách gói đã mua thành công!')
      );
    } catch (error) {
      next(error);
    }
  }


	static async cancelPricing(req: Request, res: Response, next: NextFunction) {
  const { userId } = (req as any).user;
  try {
    const result = await PricingService.cancelPricing(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(
      ApiResponse.success(
        {
          pricing: result.pricing,
          refundAmount: result.refundAmount,
        },
        result.message
      )
    );
  } catch (error) {
    next(error);
  }
}
}


export default PricingController;