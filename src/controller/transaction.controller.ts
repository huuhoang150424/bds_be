'use-strict';


import { ApiResponse } from "@helper";
import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '@service';
import { verifyPayOSSignature, BadRequestError } from '@helper';
import { Status } from "@models/enums";

class TransactionController {
  static async initiatePayment(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { amount, description } = req.body;
    try {
      const { transaction, checkoutUrl } = await TransactionService.createTransaction(userId, amount, description);
      return res.status(200).json(ApiResponse.success({ transaction, checkoutUrl }, 'Tạo giao dịch thành công'));
    } catch (error) {
      next(error);
    }
  }


  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    const { orderCode, status, signature } = req.body;
    if (!verifyPayOSSignature(req.body, signature)) {
      throw new BadRequestError('Chữ ký không hợp lệ');
    } 
    try {
      switch (status) {
        case 'completed':
          await TransactionService.completeTransaction(orderCode);
          break;
        // case 'failed':
        //   await TransactionService.updateTransactionStatus(orderCode, 'failed');
        //   break;
        // case 'cancelled':
        //   await TransactionService.updateTransactionStatus(orderCode, 'cancelled');
        //   break;
        default:
          return res.status(400).json(ApiResponse.error('Trạng thái không hợp lệ'));
      }
      return res.status(200).json(ApiResponse.success(null, 'Xử lý webhook thành công'));
    } catch (error) {
      next(error);
    }
  }
  static async successPayment(req: Request, res: Response, next: NextFunction) {
    const orderCode = Number(req.query.orderCode);
    if (isNaN(orderCode)) {
      throw new BadRequestError('orderCoder không hợp lệ');
    }
    try {
      const result =await TransactionService.completeTransaction(orderCode);
      return res.status(200).json(ApiResponse.success(result, 'Thanh toán thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async cancelPayment(req: Request, res: Response, next: NextFunction) {
    const orderCode = Number(req.query.orderCode);
    const status = req.query.status as string;
    if (isNaN(orderCode)) {
      throw new BadRequestError('orderCode không hợp lệ');
    }
    try {
      const normalizedStatus = status.toLowerCase() as Status.CANCELLED;
      const result = await TransactionService.updateTransactionStatus(orderCode, normalizedStatus);
      return res.status(200).json(ApiResponse.success(
        {
          orderCode: result.orderCode,
          status: result.status,
          amount: result.amount,
        },
        'Hủy thanh toán thành công'
      ));
    } catch (error) {
      console.error(`Error in cancelPayment for orderCode: ${orderCode}`, error);
      next(error);
    }
  }

  static async getAllTransactions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const { page, limit } = (req as any).pagination;
    const {type}=req.params;
    try {
      const result = await TransactionService.getAllTransactions(userId, page, limit,type);
      return res.status(200).json(ApiResponse.success(result, 'thành công'));
    } catch (error) {
      next(error);
    }
  }


  static async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;

    try {
      const result = await TransactionService.getFinancialSummary(userId);
      return res.status(200).json(ApiResponse.success(result, 'Lấy tóm tắt tài chính thành công'));
    } catch (error) {
      next(error);
    }
  }

}
export default TransactionController;