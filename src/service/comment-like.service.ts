'use-strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Comment, CommentLike } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/general-token';
import { NotFoundError, UnauthorizedError, transporter, ForbiddenError, TokenError, BadRequestError, CacheRepository } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import { Op } from "sequelize";



class CommentLikeService {
  // [Like Comment]
  static async likeComment(userId: string, commentId: string) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
    const existingLike = await CommentLike.findOne({ where: { userId, commentId } });
    if (existingLike) throw new ForbiddenError('Bạn đã thích bình luận này');
    return await CommentLike.create({ userId, commentId });
  }

  // [Unlike Comment]
  static async unlikeComment(userId: string, commentId: string) {
    const like = await CommentLike.findOne({ where: { userId, commentId } });
    if (!like) throw new NotFoundError('Bạn chưa thích bình luận này');
    await like.destroy();
    return { message: 'Bỏ thích bình luận thành công' };
  }

  // [Get Likes Count]
  static async getCommentLikesCount(commentId: string) {
    const count = await CommentLike.count({ where: { commentId } });
    return { commentId, likesCount: count };
  }

}

export default CommentLikeService;
