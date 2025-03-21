
import { Comment, User, CommentLike } from '@models';
import { NotFoundError, ForbiddenError, CacheRepository } from '@helper';
import { Op } from "sequelize";



class CommentService {

  static async createComment(userId: string, postId: string, content: string) {
    return await Comment.create({ userId, postId, content });
  }

  // [getComment by Post]
  static async getCommentsByPost(postId: string, page: number, limit: number, offset: number, cursor?: string ) {
    const cacheKey = cursor
      ? `comments:post:${postId}:cursor:${cursor}`
      : `comments:post:${postId}:page:${page}:limit:${limit}`;
    const cachedComments = await CacheRepository.get(cacheKey);
    if (cachedComments) {
      return JSON.parse(cachedComments);
    }
    let whereCondition: any = { postId };
    if (cursor) {
      whereCondition.createdAt = { [Op.lt]: cursor };
    }
    const comments = await Comment.findAll({
      where: whereCondition,
      include: ["user"],
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit,
    });
    await CacheRepository.set(cacheKey, comments, 60);
    return comments;
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
  static async replyToComment(userId: string, commentId: string, content: string) {
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) throw new NotFoundError("Bình luận gốc không tồn tại");
    return await Comment.create({
      userId,
      postId: parentComment.postId,
      content,
      parentId: commentId,
    });
  }

  // [Get Replies for a Specific Comment]
  static async getRepliesByParentId(parentId: string) {
    const cacheKey = `comment_replies:${parentId}`;
    const cachedReplies = await CacheRepository.get(cacheKey);
    if (cachedReplies) {
      return JSON.parse(cachedReplies);
    }
    const replies = await Comment.findAll({
      where: { parentId },
      include: [{ model: User, attributes: ["id", "fullname"] }],
      order: [["createdAt", "DESC"]],
    });
    await CacheRepository.set(cacheKey, replies, 600);
    return replies;
  }

}

export default CommentService;
