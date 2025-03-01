'use-strict';


import {ApiResponse} from "@helper";
import { Request, Response, NextFunction } from 'express';
import {TransactionService} from '@service';
import {verifyPayOSSignature,BadRequestError} from '@helper';

class TransactionController {

	static async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
			const userId=(req as any).user.userId;
			console.log((req as any).user.userId)
      const { amount, description } = req.body;
      const { transaction ,checkoutUrl} = await TransactionService.createTransaction(userId, amount, description);
      return res.status(200).json(ApiResponse.success({ transaction,checkoutUrl }, 'Tạo giao dịch thành công'));
    } catch (error) {
      next(error);
    }
  }
	static async handleWebhook(req: Request, res: Response, next: NextFunction) {
		try {
			const { orderCode, status, signature } = req.body;
			if (!verifyPayOSSignature(req.body, signature)) {
				throw new BadRequestError('Chữ ký không hợp lệ');
			}
			switch (status) {
				case 'completed':
					await TransactionService.completeTransaction(orderCode);
					break;
				case 'failed':
					await TransactionService.failTransaction(orderCode);
					break;
				case 'cancelled':
					await TransactionService.cancelTransaction(orderCode);
					break;
				default:
					return res.status(400).json(ApiResponse.error('Trạng thái không hợp lệ'));
			}
			return res.status(200).json(ApiResponse.success(null, 'Xử lý webhook thành công'));
		} catch (error) {
			next(error);
		}
	}
	static async successPayment(req: Request, res: Response, next: NextFunction) {
		try {
			const orderCode = Number(req.query.orderCode);
			if (isNaN(orderCode)) {
				throw new BadRequestError('orderCoder không hợp lệ')
			}
			await TransactionService.completeTransaction(orderCode);
			return res.status(200).json(ApiResponse.success(null, 'Thanh toán thành công'));
		} catch (error) {
			next(error);
		}
	}
	
	static async cancelPayment(req: Request, res: Response, next: NextFunction) {
		try {
			const orderCode = Number(req.query.orderCode);
			if (isNaN(orderCode)) {
				throw new BadRequestError('orderCoder không hợp lệ')
			}
			await TransactionService.cancelTransaction(orderCode);
			return res.status(200).json(ApiResponse.success(null, 'Hủy thanh toan thành công'));
		} catch (error) {
			next(error);
		}
	}
	
}


export default TransactionController;