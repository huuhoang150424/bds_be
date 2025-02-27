// comment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CommentService } from "@service";
import { ApiResponse } from "@helper";

class CommentController {
  // Tạo bình luận
  static async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { postId, content } = req.body;
      const comment = await CommentService.createComment(userId, postId, content);
      return res.status(201).json(ApiResponse.success(comment, 'Bình luận đã được tạo'));
    } catch (error) {
      next(error);
    }
  }

  // 
  static async getCommentsByPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const comments = await CommentService.getCommentsByPost(postId);
      return res.status(200).json(ApiResponse.success(comments, 'Danh sách bình luận'));
    } catch (error) {
      next(error);
    }
  }

  // [updateComment]
  static async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.params;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json(ApiResponse.error("Nội dung không được để trống", 400));
      }
      const updatedComment = await CommentService.updateComment(commentId, userId, content);
      return res.status(200).json(ApiResponse.success(updatedComment, 'Bình luận đã được cập nhật'));
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      }
    }
  }

  // [deleteCommit]
  static async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { commentId } = req.params;
      await CommentService.deleteComment(commentId, userId);
      return res.status(200).json(ApiResponse.success(null, 'Bình luận đã bị xóa'));
    } catch (error) {
      next(error);
    }
  }
}

export default CommentController;
