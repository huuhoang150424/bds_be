
import { Request, Response, NextFunction } from 'express';
import { CommentLikeService } from "@service";
import { ApiResponse } from "@helper";
import { LikeStatus } from "@models/enums";

class CommentLikeController {
  // [Like Comment]
  static async likeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.body;
      const result = await CommentLikeService.toggleLikeStatus(userId, commentId, LikeStatus.LIKE);
      return res.status(200).json(ApiResponse.success(result, 'Thao tác thích bình luận thành công'));
    } catch (error) {
      next(error);
    }
  }

  // [Dislike Comment]
  static async dislikeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.body;
      const result = await CommentLikeService.toggleLikeStatus(userId, commentId, LikeStatus.DISLIKE);
      return res.status(200).json(ApiResponse.success(result, 'Thao tác không thích bình luận thành công'));
    } catch (error) {
      next(error);
    }
  }

  // [Get Reaction Count]
  static async getCommentReactionCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const result = await CommentLikeService.getCommentReactionCount(commentId);
      return res.status(200).json(ApiResponse.success(result, 'Số lượt thích và không thích của bình luận'));
    } catch (error) {
      next(error);
    }
  }
}

export default CommentLikeController;
