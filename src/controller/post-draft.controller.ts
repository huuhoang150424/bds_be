'use-strict';

import {ApiResponse} from "@helper";
import {PostDraftService} from "@service";
import { Request, Response, NextFunction } from 'express';

class PostDraftController {
  //[create draft]
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const imageFiles = req.files as Express.Multer.File[];
      const imageUrls = imageFiles.map((file) => file.path);
      const newPost = await PostDraftService.createPostDraft(userId, req.body, imageUrls);
      return res.status(201).json(ApiResponse.success(newPost, 'Tạo bài đăng thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[get draft]
  static async getPostDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const postDraftId = req.params.postDraftId;
      const postDraft = await PostDraftService.getPostDraft(postDraftId);
      return res.status(200).json(ApiResponse.success(postDraft, 'Thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[get all post draft]
  static async getAllPostDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const allPostDraft = await PostDraftService.getAllPostDraft(userId, page, limit);
      return res.status(200).json(ApiResponse.success(allPostDraft, 'Thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[delete post draft]
  static async deletePostDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const postDraftId = req.params.postDraftId;
      await PostDraftService.deletePostDraft(postDraftId);
      return res.status(200).json(ApiResponse.success(null, 'Xóa bản nháp thành công!'));
    } catch (error) {
      next(error);
    }
  }
}


export default PostDraftController;