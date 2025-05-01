
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
  const { page, limit } = (req as any).pagination;
  const lastCreatedAt = req.query.lastCreatedAt as string | undefined;

  if (lastCreatedAt) {
    page===undefined;
  }

  try {
    const newsList = await NewsService.getAllNews(limit, page, lastCreatedAt);
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
  static async editNews(req: Request, res: Response, next: NextFunction) {
    const {newsId} = req.params;
    const { userId } = (req as any).user;
    try {
      const image = req.file?.path; 
      const removedImageUrl = req.body.removedImageUrl; 
      const updatedNews = await NewsService.updateNews(newsId, userId, image, req.body, removedImageUrl);
      return res.status(200).json(ApiResponse.success(updatedNews, 'Cập nhật tin tức thành công'));
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


	static async findNews(req: Request, res: Response, next: NextFunction) {
		const { keyword } = req.query;
		const { limit, page, offset } = (req as any).pagination;
		
		try {
			const result = await NewsService.findNews(
				keyword as string, 
				Number(page), 
				Number(limit), 
				Number(offset)
			);
			return res.status(200).json(ApiResponse.success(result, "thành công"));
		} catch (error) {
			next(error);
		}
	}
}

export default NewsController;
