'use-strict';
import { Comment, CommentLike } from '@models';
import { NotFoundError, UnauthorizedError, transporter, ForbiddenError, BadRequestError, CacheRepository } from '@helper';
import { LikeStatus } from "@models/enums";

class CommentLikeService {
  // [Like or Dislike Comment]
  static async toggleLikeStatus(userId: string, commentId: string, status: LikeStatus) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
    const existingReaction = await CommentLike.findOne({ where: { userId, commentId } });
    if (existingReaction) {
      if (existingReaction.status === status) {
        await existingReaction.destroy();
        return { message: `Đã xóa trạng thái ${status.toLowerCase()} khỏi bình luận` };
      } else {
        existingReaction.status = status;
        await existingReaction.save();
        return existingReaction;
      }
    } else {
      return await CommentLike.create({ userId, commentId, status });
    }
  }
  // [Get Like & Dislike Count]
  static async getCommentReactionCount(commentId: string) {
    const likesCount = await CommentLike.count({ where: { commentId, status: LikeStatus.LIKE } });
    const dislikesCount = await CommentLike.count({ where: { commentId, status: LikeStatus.DISLIKE } });
    return { commentId, likesCount, dislikesCount };
  }

}

export default CommentLikeService;
