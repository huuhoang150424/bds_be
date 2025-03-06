
import { Request, Response, NextFunction } from 'express';
import { CommentLikeService } from "@service";
import { ApiResponse } from "@helper";

class CommentLikeController {
  // [Like Comment]
  static async likeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.body;
      const like = await CommentLikeService.likeComment(userId, commentId);
      return res.status(201).json(ApiResponse.success(like, 'Đã thích bình luận'));
    } catch (error) {
      next(error);
    }
  }

  // [Unlike Comment]
  static async unlikeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.body;
      await CommentLikeService.unlikeComment(userId, commentId);
      return res.status(200).json(ApiResponse.success(null, 'Đã bỏ thích bình luận'));
    } catch (error) {
      next(error);
    }
  }

  // [Get Likes Count]
  static async getCommentLikesCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const count = await CommentLikeService.getCommentLikesCount(commentId);
      return res.status(200).json(ApiResponse.success(count, 'Số lượt thích của bình luận'));
    } catch (error) {
      next(error);
    }
  }
}

export default CommentLikeController;
