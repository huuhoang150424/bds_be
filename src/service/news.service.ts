
import { ActionType, Roles } from "@models/enums";
import { News, NewsHistory } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, Transaction } from "sequelize";

class NewsService {
  static async createNew(userId: string, title: string, content: string, image: string, origin: string, category: string, readingtime: number) {
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
      return cachedData;
    }
    const whereCondition = lastId ? { id: { [Op.lt]: lastId } } : {};
    const newsList = await News.findAll({
      where: whereCondition,
      order: sequelize.random(),
      limit,
    });
    await CacheRepository.set(cacheKey, newsList, 300);
    return newsList;
  }

  static async getNew(slug: string) {
    const cacheKey = `news:slug:${slug}`;
    const cachedNews = await CacheRepository.get(cacheKey);
    if (cachedNews) {
      return cachedNews;
    }
    const findNews = await News.findOne({ where: { slug } });
    if (!findNews) {
      throw new NotFoundError('Không tìm thấy bài đăng!');
    }
    await CacheRepository.set(cacheKey, findNews, 300);
    return findNews;
  }


  static async updateNews(newsId: string, userId: string, image: string, updatedData: Partial<News>) {
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
      await news.update({  imageUrl: image ,...updatedData}, { transaction });
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
