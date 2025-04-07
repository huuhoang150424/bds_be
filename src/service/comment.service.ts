
import { Comment, User, CommentLike } from '@models';
import { NotFoundError, ForbiddenError, CacheRepository } from '@helper';
import { NotificationService } from "@service";
import { Op } from "sequelize";



class CommentService {

  static async createComment(userId: string, postId: string, content: string) {
    return await Comment.create({ userId, postId, content });
  }

  // [getComment by Post]
	static async getCommentsByPost(postId: string, limit: number = 5, page: number = 1, offset: number = 0) {
		const whereCondition: any = {
			postId,
			parentId: null, 
		};
	
		const total = await Comment.count({ where: whereCondition });
	
		const comments = await Comment.findAll({
			where: whereCondition,
			include: [{ model: User, as: "user", attributes: ["fullname", "avatar"] }],
			order: [["createdAt", "DESC"]],
			limit,
			offset,
		});
	
		const totalPages = Math.ceil(total / limit);
	
		return {
			data: comments,
			meta: {
				currentPage: page,
				totalPages,
				total,
				hasNextPage: page < totalPages,
			},
		};
	}
	



  // [updateComment]
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
    const comment = await Comment.findByPk(commentId, {
      include: [{ model: Comment, as: "replies" }],
    });
    if (!comment) throw new NotFoundError("Không tìm thấy comment");
    if (comment.userId !== userId) throw new Error("Bạn không có quyền xóa comment này");

    await CommentLike.destroy({ where: { commentId } });

    if (comment.replies.length > 0) {
      const replyIds = comment.replies.map(reply => reply.id);
      await CommentLike.destroy({ where: { commentId: replyIds } });
      await Comment.destroy({ where: { id: replyIds } });
    }
    await comment.destroy();
    return { message: "Xóa comment thành công" };
  }


  // [Reply to Comment]
	static async replyToComment(userId: string, commentId: string, postId: string, content: string) {
		let parentId: string | null = null;
		let parentCommentUserId: string | null = null;
		let level = 1;
	
		if (commentId) {
			const parentComment = await Comment.findByPk(commentId, {
				include: [{ model: Comment, as: 'parentComment' }], 
			});
			if (!parentComment) throw new NotFoundError("Bình luận gốc không tồn tại");
	
			parentId = parentComment.id;
			parentCommentUserId = parentComment.userId;
			level = parentComment.level + 1;
	
			if (level > 3) {
				if (parentComment.parentId) {
					const grandParentComment = await Comment.findByPk(parentComment.parentId);
					if (grandParentComment && grandParentComment.level === 2) {
						parentId = grandParentComment.id; 
						level = 3; 
					}
				} else {
				
					level = 3;
				}
			}
		}
	
		const newComment = await Comment.create({
			userId,
			postId,
			content,
			parentId,
			level, // Lưu level đã điều chỉnh
		});
	
		if (parentCommentUserId && parentCommentUserId !== userId) {
			await NotificationService.createNotification(
				parentCommentUserId,
				`Người dùng ${userId} đã phản hồi bình luận của bạn: "${content}"`
			);
		}
	
		return newComment;
	}


  // [Get Replies for a Specific Comment]
  static async getRepliesByParentId(parentId: string) {
    // const cacheKey = `comment_replies:${parentId}`;
    // const cachedReplies = await CacheRepository.get(cacheKey);
    // if (cachedReplies) {
    //   return JSON.parse(cachedReplies);
    // }
    const replies = await Comment.findAll({
      where: { parentId },
      include: [
        {
          model: User,
          attributes: ["id", "fullname", 'avatar']
        }
      ],
      order: [["createdAt", "DESC"]],
    });
    //await CacheRepository.set(cacheKey, replies, 600);
    return replies;
  }

}

export default CommentService;
