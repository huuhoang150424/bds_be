import { CategoryNew } from './../models/enums/new';
"use strict";
import { Request, Response, NextFunction } from "express";
import { NewsService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class NewsController {
  //[createNew]
  static async createNew(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, category, readingtime } = req.body;
      const image = req.file?.path;
      const userId = (req as any).user?.userId;
      console.log(userId)
      if (!image) {
        throw new BadRequestError("anh khong phu hop !")
      }
      const news = await NewsService.createNew(userId, title, content, image, category, readingtime);
      return res.status(201).json(ApiResponse.success(news, "Tạo tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }

  // [getAllNews] 
  static async getAllNews(req: Request, res: Response, next: NextFunction) {
    try {
      const lastId = req.query.lastId as string | undefined; 
      const limit = parseInt(req.query.limit as string) || 10;

      const newsList = await NewsService.getAllNews(lastId, limit);
      return res.status(200).json(ApiResponse.success(newsList, "Lấy danh sách tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }


  //[deleteNews]
  static async deleteNews(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json(ApiResponse.error("ID không hợp lệ"));
      }

      await NewsService.deleteNews(id);
      return res.status(200).json(ApiResponse.success(null, "Xóa tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }
}

export default NewsController;
