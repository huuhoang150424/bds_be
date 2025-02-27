'use-strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Comment } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/general-token';
import { NotFoundError, UnauthorizedError, transporter, ForbiddenError, TokenError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';



class CommentService {

  static async createComment(userId: string, postId: string, content: string) {
    return await Comment.create({ userId, postId, content });
  }

  // [getComment by Post]
  static async getCommentsByPost(postId: string) {
    return await Comment.findAll({ where: { postId }, include: ['user'] });
  }
  static async updateComment(commentId: string, userId: string, content: string) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError('Không tìm thấy comment');
    if (comment.userId !== userId) {
      throw new ForbiddenError('Bạn không có quyền cập nhật comment này');
    }
    comment.content = content;
    await comment.save();
    return comment;
  }


  // [deleteCommit]
  static async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError('Không tìm thấy comment');
    if (comment.userId !== userId) throw new Error('Bạn không có quyền xóa comment này');
    await comment.destroy();
    return { message: 'Xóa comment thành công' };
  }

}

export default CommentService;
