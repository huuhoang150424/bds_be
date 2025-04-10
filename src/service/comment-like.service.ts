
import { Comment, CommentLike } from '@models';
import { NotFoundError } from '@helper';
import { LikeStatus } from "@models/enums";
import NotificationService from './notification.service';
import UserService from './user.service';

class CommentLikeService {
  static async toggleLikeStatus(userId: string, commentId: string, status: LikeStatus) {
    const comment = await Comment.findByPk(commentId);
		const user=await UserService.getUserById(userId);
    if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
    const existingReaction = await CommentLike.findOne({ where: { userId, commentId } });
    if (existingReaction) {
      if (existingReaction.status === status) {
        await existingReaction.destroy();
        return { message: `Đã xóa trạng thái ${status.toLowerCase()} khỏi bình luận` };
      } else {
				await NotificationService.createNotification(comment.userId,`${user.fullname} Đã ${status} bình luận của bạn`);
        existingReaction.status = status;
        await existingReaction.save();
        return existingReaction;
      }
    } else {
			await NotificationService.createNotification(comment.userId,`${user.fullname} Đã ${status} bình luận của bạn`);
      return await CommentLike.create({ userId, commentId, status });
    }
  }
  static async getCommentReactionCount(commentId: string) {
    const likesCount = await CommentLike.count({ where: { commentId, status: LikeStatus.LIKE } });
    const dislikesCount = await CommentLike.count({ where: { commentId, status: LikeStatus.DISLIKE } });
    return { commentId, likesCount, dislikesCount };
  }

}

export default CommentLikeService;
