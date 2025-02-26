import { CategoryNew } from './../models/enums/new';
"use strict";
import { News } from "@models";
import { Request, Response, NextFunction } from "express";
import { NewsService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";
import { error } from 'console';

class NewsController {
  //[createNew]
  static async createNew(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, origin_post, category, readingtime } = req.body;
      const image = req.file?.path;
      const userId = (req as any).user?.userId;
      console.log(userId)
      if (!image) {
        throw new BadRequestError("anh khong phu hop !")
      }
      const news = await NewsService.createNew(userId, title, content, image, origin_post, category, readingtime);
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
  // [getNew]

  static async getNews(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const findNews = await NewsService.getNew(slug);
      return res.status(200).json(ApiResponse.success(findNews, "Thành công"));
    } catch (error) {
      next(error);
    }
  }
  // [UpdateNews]
  static async updateNews(req: Request, res: Response, next: NextFunction) {
    try {
      const newsId = req.params.newsId;
      const userId = (req as any).user?.userId;
      const { title, content, origin_post, category, readingtime } = req.body;
      const image = req.file?.path;

      const updatedData: Partial<News> = {
        ...(title && { title }),
        ...(content && { content }),
        ...(origin_post && { origin_post }),
        ...(category && { category }),
        ...(readingtime && { readingTime: readingtime }),
        ...(image && { imageUrl: image }),
      };

      const updatedNews = await NewsService.updateNews(newsId, userId, updatedData);
      return res.status(200).json(ApiResponse.success(updatedNews, "Cập nhật tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }


  //[deleteNews]
  static async deleteNews(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.newsId;
      await NewsService.deleteNews(id);
      return res.status(200).json(ApiResponse.success(null, "Xóa tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }
}

export default NewsController;
