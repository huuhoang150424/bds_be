
import { ActionType, Roles } from "@models/enums";
import { News, NewsHistory, User } from "@models";
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


	static async getAllNews(limit: number = 10, lastCreatedAt?: string) {
		const MAX_TOTAL_LIMIT = 30;
	
		const whereCondition = lastCreatedAt ? { createdAt: { [Op.lte]: new Date(lastCreatedAt) } } : {};
		
		const newsList = await News.findAll({
			where: whereCondition,
			order: [["createdAt", "DESC"]],
			limit,
			include: [{ model: User, as: "author", attributes: ["fullname"] }],
		});
	
		const lastNewsCreatedAt = newsList.length > 0 ? newsList[newsList.length - 1].createdAt : null;
	
		const skippedCount = lastCreatedAt
			? await News.count({
					where: { createdAt: { [Op.gt]: new Date(lastCreatedAt) } },
				})
			: 0;
	
		const totalLoaded = skippedCount + newsList.length;
	
		const totalRemaining = await News.count({
			where: lastNewsCreatedAt ? { createdAt: { [Op.lt]: lastNewsCreatedAt } } : {},
		});
		const hasMore = totalRemaining > 0 && totalLoaded < MAX_TOTAL_LIMIT;
	
		const adjustedNewsList = totalLoaded > MAX_TOTAL_LIMIT
			? newsList.slice(0, MAX_TOTAL_LIMIT - skippedCount)
			: newsList;
	
		const result = {
			data: adjustedNewsList,
			meta: {
				hasNextPage: hasMore,
				nextCreatedAt: lastNewsCreatedAt,
				total: await News.count(),
			},
		};
	
		return result;
	}

  static async getNew(slug: string) {
    const cacheKey = `news:slug:${slug}`;
    const cachedNews = await CacheRepository.get(cacheKey);
    if (cachedNews) {
      return JSON.parse(cachedNews);
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
      const news = await News.findOne({ where: { id: newsId, userId }, transaction });
      if (!news) {
        throw new NotFoundError("Tin tức không tồn tại hoặc bạn không có quyền cập nhật");
      }
      if (Object.keys(updatedData).length === 0) {
        throw new BadRequestError("Không có dữ liệu nào để cập nhật");
      }
      await this.saveNewsHistory(newsId, userId, ActionType.UPDATE, transaction);
      await news.update({ imageUrl: image, ...updatedData }, { transaction });
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


	static async findNews(keyword: string, page: number, limit: number, offset: number) {
		const news = await News.findAndCountAll({
			where: {
				title: {
					[Op.like]: `%${keyword}%`
				}
			},
			limit,
			offset,
			order: [["createdAt", "DESC"]],
			distinct: true
		});
		return news;
	}

}

export default NewsService;
