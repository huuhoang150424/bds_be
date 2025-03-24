
'use-strict';
import { Comment } from '@models';
import { Request, Response, NextFunction } from 'express';
import { CommentService, NotificationService } from "@service";
import { ApiResponse, NotFoundError } from "@helper";

class CommentController {
  // [createComment]
  static async createComment(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { postId, content } = req.body;
    try {
      const comment = await CommentService.createComment(userId, postId, content);
      return res.status(201).json(ApiResponse.success(comment, 'Bình luận đã được tạo'));
    } catch (error) {
      next(error);
    }
  }

  // [getCommentsByPost]
  static async getCommentsByPost(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;
		const { page, limit, offset } = (req as any).pagination;
    const cursor = req.query.cursor as string | undefined;
    try {
      const comments = await CommentService.getCommentsByPost(postId, page, limit,offset,cursor);
      return res.status(200).json(ApiResponse.success(comments, "Danh sách bình luận"));
    } catch (error) {
      next(error);
    }
  }
  // [updateComment]

  static async updateComment(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { commentId } = req.params;
    const { content } = req.body;
    try {
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
    const { userId } = (req as any).user;
    const { commentId } = req.params;
    try {
      await CommentService.deleteComment(commentId, userId);
      return res.status(200).json(ApiResponse.success(null, 'Bình luận đã bị xóa'));
    } catch (error) {
      next(error);
    }
  }

  // [Reply to Comment]
  static async replyToComment(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { commentId } = req.params;
    const { content } = req.body;
    try {
      const parentComment = await Comment.findByPk(commentId);
      if (!parentComment) throw new NotFoundError("Bình luận gốc không tồn tại");
      const reply = await Comment.create({
        userId,
        postId: parentComment.postId,
        content,
        parentId: commentId,
      });
      if (parentComment.userId !== userId) {
        await NotificationService.createNotification(
          parentComment.userId,
          `Người dùng ${userId} đã phản hồi bình luận của bạn: "${content}"`
        );
      }
      return res.status(201).json(ApiResponse.success(reply, "Đã phản hồi bình luận"));
    } catch (error) {
      next(error);
    }
  }

  // [Get Replies of a Specific Comment]
  static async getReplies(req: Request, res: Response, next: NextFunction) {
    const { commentId } = req.params;
    try {
      const replies = await CommentService.getRepliesByParentId(commentId);
      return res.status(200).json(ApiResponse.success(replies, "Danh sách phản hồi"));
    } catch (error) {
      next(error);
    }
  }

}

export default CommentController;
