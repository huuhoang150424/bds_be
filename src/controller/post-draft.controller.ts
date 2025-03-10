'use-strict';

import { ApiResponse } from "@helper";
import { PostDraftService } from "@service";
import { Request, Response, NextFunction } from 'express';

class PostDraftController {
  //[create draft]
  static async create(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const imageFiles = req.files as Express.Multer.File[];
    const imageUrls = imageFiles.map((file) => file.path);
    try {
      const newPost = await PostDraftService.createPostDraft(userId, req.body, imageUrls);
      return res.status(201).json(ApiResponse.success(newPost, 'Tạo bài đăng thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[get draft]
  static async getPostDraft(req: Request, res: Response, next: NextFunction) {
    const {postDraftId} = req.params;
    try {
      const postDraft = await PostDraftService.getPostDraft(postDraftId);
      return res.status(200).json(ApiResponse.success(postDraft, 'Thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[get all post draft]
  static async getAllPostDraft(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    try {
      const allPostDraft = await PostDraftService.getAllPostDraft(userId, page, limit);
      return res.status(200).json(ApiResponse.success(allPostDraft, 'Thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[delete post draft]
  static async deletePostDraft(req: Request, res: Response, next: NextFunction) {
    const { postDraftId } = req.params;
    try {
      await PostDraftService.deletePostDraft(postDraftId);
      return res.status(200).json(ApiResponse.success(null, 'Xóa bản nháp thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[update post draft]
  static async updatePostDraft(req: Request, res: Response, next: NextFunction) {
    const { postDraftId } = req.params;
    const imageFiles = req.files as Express.Multer.File[];
    const imageUrls = imageFiles.map((file) => file.path);
    try {
      const newPostDraft = await PostDraftService.updatePostDraft(postDraftId, req.body, imageUrls);
      return res.status(200).json(ApiResponse.success(newPostDraft, 'Cập nhât bản nháp thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[update post draft]
  static async publicPostDraft(req: Request, res: Response, next: NextFunction) {
    const { postDraftId } = req.params;
    try {
      const newPost = await PostDraftService.publishPostDraft(postDraftId);
      return res.status(201).json(ApiResponse.success(newPost, 'Xuất bản nháp thành công!'));
    } catch (error) {
      next(error);
    }
  }

}
export default PostDraftController;