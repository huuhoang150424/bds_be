import { ActionType, Roles, CategoryNew } from "@models/enums";
import { UserView, Post, User, News, Image, Comment, Wishlist, Report, UserPricing, Rating } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { NotificationService } from "@service";
import { sequelize } from '@config/database';
import { Op, fn, col, literal, Sequelize, QueryTypes } from "sequelize";



class ProfessionalAgentService {

  // [ check if user is eligible to become ProfessionalAgents]
  static async checkUserCriteria(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
    const [
      totalViews,
      commentCount,
      avgRating,
      completedPostsCount
    ] = await Promise.all([
      UserView.count({
        where: {
          userId,
          createdAt: { [Op.gte]: thirtyDaysAgo }
        }
      }),
      Comment.count({
        include: [{ model: Post, where: { userId }, required: true }]
      }),
      Rating.findOne({
        attributes: [[fn("AVG", col("rating")), "averageRating"]],
        include: [{ model: User, where: { id: userId }, required: true }],
        raw: true
      }),
      Post.count({
        where: { userId, status: "Đã bàn giao" }
      })
    ]);
  
    const avgRatingValue = avgRating ? Number((avgRating as any).averageRating) : 0;
  
    if (totalViews < 1) {
      console.log(`❌ Người dùng ${userId} không đủ lượt xem: ${totalViews}/1000`);
      return false;
    }
    if (commentCount < 10) {
      console.log(`❌ Người dùng ${userId} không đủ bình luận: ${commentCount}/50`);
      return false;
    }
    if (avgRatingValue < 2.0) {
      console.log(`❌ Người dùng ${userId} không đủ rating: ${avgRatingValue}/4.0`);
      return false;
    }
    if (completedPostsCount < 2) {
      console.log(`❌ Người dùng ${userId} không đủ bài viết đã bàn giao: ${completedPostsCount}/5`);
      return false;
    }
    return true;
  }
  

  static async updateProfessionalStatus(userId: string, status: boolean) {
    await User.update(
      { isProfessional: status },
      { where: { id: userId } }
    );
    console.log(`Đã cập nhật trạng thái người dùng ${userId} thành ${status ? 'chuyên nghiệp' : 'thường'}`);
    return true;
  }

  static async increasePriority(userId: string) {
    const result = await Post.update(
      { priority: literal('priority + 10') },
      { where: { userId } }
    );
    console.log(`Đã tăng priority cho ${result[0]} bài viết của người dùng ${userId}`);
    return result[0];
  }

  static async checkProfessionalStatus() {
    // Truy vấn danh sách gói pricing chuyên nghiệp còn hiệu lực
    const activePricings = await UserPricing.findAll({
      where: {
        endDate: { [Op.gt]: new Date() } 
      },
      attributes: ["userId"]
    });
  
    const userIds = activePricings.map((pricing) => pricing.userId);
  
    // Lấy danh sách người dùng từ `userIds`
    const usersWithActivePlans = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ["id", "isProfessional"]
    });
  
    const results = {
      upgraded: 0,
      downgraded: 0,
      maintained: 0,
      processed: 0
    };
  
    console.log(`📢 Đang kiểm tra trạng thái của ${usersWithActivePlans.length} người dùng...`);
  
    await Promise.all(usersWithActivePlans.map(async (user) => {
      const userId = user.id;
      const wasProf = user.isProfessional || false;
  
      // Kiểm tra điều kiện chuyên nghiệp
      const meetsCriteria = await this.checkUserCriteria(userId);
  
      // Cập nhật trạng thái nếu cần
      if (meetsCriteria !== wasProf) {
        await this.updateProfessionalStatus(userId, meetsCriteria);
  
        if (meetsCriteria) {
          await this.increasePriority(userId);
          await NotificationService.createNotification(
            userId,
            "🎉 Chúc mừng! Bạn đã trở thành Môi giới chuyên nghiệp!"
          );
          results.upgraded++;
        } else {
          await NotificationService.createNotification(
            userId,
            "⚠️ Trạng thái Môi giới chuyên nghiệp của bạn đã hết hiệu lực."
          );
          results.downgraded++;
        }
      } else {
        results.maintained++;
      }
      results.processed++;
    }));
    return results;
  }


  // [get All ProfessionalAgents]
  static async getProfessionalAgents() {
    const agents = await User.findAll({
      where: { 
        isProfessional: true 
      },
      attributes: [
        'id', 'fullname', 'email', 'avatar', 'isProfessional',
        'createdAt', 'updatedAt'
      ]
    });
    return agents;
  }

  // [check ProfessionalAgents for user]
  static async checkSingleUserStatus(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User không tồn tại');
    }
    
    const oldStatus = user.isProfessional || false;
    const newStatus = await this.checkUserCriteria(userId);
    
    // Chi tiết kiểm tra
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const totalViews = await UserView.count({
      where: {
        userId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    const commentCount = await Comment.count({
      include: [{
        model: Post,
        where: { userId },
        required: true
      }]
    });
    
    const avgRating = await Rating.findOne({
      attributes: [
        [fn('AVG', col('rating')), 'averageRating']
      ],
      include: [{
        model: User,
        where: { id: userId },
        required: true
      }],
      raw: true
    });
    
    const avgRatingValue = avgRating ? Number((avgRating as any).averageRating) : 0;
    
    const completedPostsCount = await Post.count({
      where: {
        userId,
        status: 'Đã bàn giao'
      }
    });
    
    if (oldStatus !== newStatus) {
      await this.updateProfessionalStatus(userId, newStatus);
      
      if (newStatus) {
        await this.increasePriority(userId);
        await NotificationService.createNotification(
          userId,
          "Chúc mừng! Bạn đã trở thành Môi giới chuyên nghiệp!"
        );
      } else {
        await NotificationService.createNotification(
          userId, 
          "Thông báo: Trạng thái Môi giới chuyên nghiệp của bạn đã hết hiệu lực."
        );
      }
    }
    return {
      userId,
      oldStatus,
      newStatus,
      statusChanged: oldStatus !== newStatus,
      details: {
        totalViews,
        commentCount,
        avgRating: avgRatingValue,
        completedPostsCount,
        criteria: {
          views: totalViews >= 1000,
          comments: commentCount >= 50,
          rating: avgRatingValue >= 4.0,
          completedPosts: completedPostsCount >= 5
        }
      }
    };
  }

};
export default ProfessionalAgentService; 