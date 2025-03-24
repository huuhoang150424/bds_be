import { Rating } from "@models";
import { NotFoundError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Transaction } from "sequelize";

class RatingService {
  static async createRating(userId: string, postId: string, rating: number | string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      return  await Rating.create({ userId, postId, rating }, { transaction });
    });
  }

  static async updateRating(ratingId: string, userId: string, rating: number) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const existingRating = await Rating.findOne({ where: { id: ratingId, userId }, transaction });
      if (!existingRating) {
        throw new NotFoundError("Rating not found");
      }
      await existingRating.update({ rating }, { transaction });
      return existingRating;
    });
  }

  static async deleteRating(userId: string, ratingId: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const rating = await Rating.findOne({ where: { id: ratingId, userId }, transaction });
      if (!rating) {
        throw new NotFoundError("Rating not found");
      }
      await rating.destroy({ transaction });
      return { message: "Rating deleted successfully" };
    });
  }

  static async getRatingsByPostId(postId: string) {
    const cacheKey = `ratings:post:${postId}`;
    const cachedData = await CacheRepository.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const ratings = await Rating.findAll({ where: { postId } });
    await CacheRepository.set(cacheKey, JSON.stringify(ratings), 300);
    return ratings;
  }
}

export default RatingService;
