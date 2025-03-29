
"use strict";
import { CategoryNew } from '@models/enums';
import { News } from "@models";
import { Request, Response, NextFunction } from "express";
import { NewsService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";


class NewsController {
  //[createNew]
  static async createNew(req: Request, res: Response, next: NextFunction) {
    const { title, content, origin_post, category, readingtime } = req.body;
    const image = req.file?.path || "";
    const { userId } = (req as any).user;
    try {
      const news = await NewsService.createNew(userId, title, content, image, origin_post, category, readingtime);
      return res.status(201).json(ApiResponse.success(news, "Tạo tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }

  // [getAllNews] 
	static async getAllNews(req: Request, res: Response, next: NextFunction) {
		const lastCreatedAt = req.query.lastCreatedAt as string | undefined;
		const { limit } = (req as any).pagination;
		try {
			const newsList = await NewsService.getAllNews(limit, lastCreatedAt);
			return res.status(200).json(ApiResponse.success(newsList, "Lấy danh sách tin tức thành công"));
		} catch (error) {
			next(error);  
		}
	}

  // [getNew]
  static async getNews(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params;
    try {
      const findNews = await NewsService.getNew(slug);
      return res.status(200).json(ApiResponse.success(findNews, "Thành công"));
    } catch (error) {
      next(error);
    }
  }


  // [UpdateNews]
  static async updateNews(req: Request, res: Response, next: NextFunction) {
    const newsId = req.params.newsId;
    const { userId } = (req as any).user;
    try {
      const image = req.file?.path;
      if (!image) {
        throw new BadRequestError("ảnh không hợp lệ");
      }
      const updatedNews = await NewsService.updateNews(newsId, userId, image, req.body);
      return res.status(200).json(ApiResponse.success(updatedNews, "Cập nhật tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }


  //[deleteNews]
  static async deleteNews(req: Request, res: Response, next: NextFunction) {
    const { newsId } = req.params;
    const { userId } = (req as any).user;
    try {
      await NewsService.deleteNews(newsId, userId);
      return res.status(200).json(ApiResponse.success(null, "Xóa tin tức thành công"));
    } catch (error) {
      next(error);
    }
  }

}

export default NewsController;
