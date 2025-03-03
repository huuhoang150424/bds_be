
import { ActionType, Roles } from "@models/enums";
"use strict";
import { News, NewsHistory, User } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, Transaction } from "sequelize";

class NewsService {
  static async createNew(userId: number, title: string, content: string, image: string, origin: string, category: string, readingtime: number) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.create({
        userId,
        title,
        content,
        imageUrl: image,
        origin_post: origin,
        category,
        readingTime: readingtime
      }, { transaction });

      await this.saveNewsHistory(news.id.toString(), userId.toString(), ActionType.CREATE, transaction);
      return news;
    });
  }

  static async getAllNews(lastId?: string, limit: number = 10) {
    const cacheKey = `news:loadmore:lastId:${lastId || 'none'}:limit:${limit}`;
    const cachedData = await CacheRepository.get(cacheKey);
    if (cachedData) {
      console.log("✅ Lấy danh sách tin tức từ cache");
      return JSON.parse(cachedData);
    }
    const whereCondition = lastId ? { id: { [Op.lt]: lastId } } : {};
    const newsList = await News.findAll({
      where: whereCondition,
      order: sequelize.random(),
      limit,
    });
    await CacheRepository.set(cacheKey, JSON.stringify(newsList), 300);
    return newsList;
  }

  static async getNew(slug: string) {
    const findNews = await News.findOne({ where: { slug } });
    if (!findNews) {
      throw new NotFoundError('không tìm thấy bài đăng!');
    }
    return findNews;
  }

  static async updateNews(newsId: string, userId: string, updatedData: Partial<News>) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.findByPk(newsId, { transaction });
      if (!news) {
        throw new NotFoundError("Tin tức không tồn tại");
      }
      if (news.userId !== userId) {
        throw new UnauthorizedError("Bạn không có quyền cập nhật tin này");
      }
      if (Object.keys(updatedData).length === 0) {
        throw new BadRequestError("Không có dữ liệu nào để cập nhật");
      }
      await this.saveNewsHistory(newsId, userId, ActionType.UPDATE, transaction);
      await news.update(updatedData, { transaction });
      return news;
    });
  }

  static async deleteNews(id: string, userId: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.findByPk(id, { transaction });
      if (!news) {
        throw new NotFoundError("Tin tức không tồn tại");
      }
      await this.saveNewsHistory(id, userId, ActionType.DELETE, transaction);
      console.log("✅ Đã gọi saveNewsHistory thành công");

      await news.destroy({ transaction });
      return { message: "Tin tức đã bị xóa" };
    });
  }

  static async saveNewsHistory(newsId: string, userId: string, action: ActionType, transaction: Transaction) {
    const news = await News.findByPk(newsId, { transaction });
    if (!news) {
      throw new NotFoundError("Tin tức không tồn tại");
    }
    await NewsHistory.create(
      {
        newsId,
        userId,
        createdBy: Roles.User,
        title: news.title,
        content: news.content,
        originPost: news.origin_post,
        imageUrl: news.imageUrl,
        category: news.category,
        readingTime: news.readingTime,
        action,
        changedAt: new Date(),
        changeBy: userId,
      },
      { transaction }
    );
  }

}

export default NewsService;
