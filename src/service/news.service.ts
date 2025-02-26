"use strict";
import { News, NewsHistory } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository } from "@helper";
import { Sequelize } from 'sequelize-typescript';
import { Op } from "sequelize";

class NewsService {
  static async createNew(userId: number, title: string, content: string, origin: string, image: string, category: string, readingtime: number) {
    const news = await News.create({
      userId,
      title,
      content,
      imageUrl: image,
      origin_post: origin,
      category,
      readingTime: readingtime
    });
    return news;
  }

  // GetALLNews
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
      order: Sequelize.literal("RAND()"),
      limit,
    });
    await CacheRepository.set(cacheKey, JSON.stringify(newsList), 300);
    return newsList;
  }

  //GetNews
  static async getNew(slug: string) {
    const findNews = await News.findOne({
      where: { slug: slug }
    })
    if (!findNews) {
      throw new NotFoundError('không tìm thấy bài đăng!');
    }
    return findNews;
  }

  //UpdateNews
  static async updateNews(newsId: string, userId: string, updatedData: Partial<News>) {
    const news = await News.findByPk(newsId);
    if (!news) {
      throw new NotFoundError("Tin tức không tồn tại");
    }
    if (news.userId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền cập nhật tin này");
    }
    await NewsHistory.create({
      newsId: news.id,
      title: news.title,
      content: news.content,
      origin_post: news.origin_post,
      imageUrl: news.imageUrl,
      category: news.category,
      readingTime: news.readingTime,
    });
    await news.update(updatedData);
    return news;
  }

  //DeleteNews
  static async deleteNews(id: string) {
    const news = await News.findByPk(id);
    if (!news) {
      throw new NotFoundError("Tin tức không tồn tại");
    }
    await news.destroy();
    return { message: "Tin tức đã bị xóa" };
  }
}
export default NewsService;
