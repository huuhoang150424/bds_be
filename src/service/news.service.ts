"use strict";
import { News } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository } from "@helper";
import { Sequelize  } from 'sequelize-typescript';
import { Op } from "sequelize";

class NewsService {
  static async createNew(userId: number, title: string, content: string, image: string, category: string, readingtime: number ) {
    const news = await News.create({ 
      userId,
      title, 
      content, 
      imageUrl: image, 
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
  static async getNew(slug: string){
    const findNews = await News.findOne({
      where:  {slug: slug}
    })
    if(!findNews){
      throw new NotFoundError('không tìm thấy bài đăng!');
    }
    return findNews;
  }

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
