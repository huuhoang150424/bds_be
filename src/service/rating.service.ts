"use strict";

import { ActionType, Roles } from "@models/enums";
import { Rating } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, Transaction } from "sequelize";

class RatingService {
  // [Create Rating]
  static async createRating(userId: string, postId: string, rating: number) {
    if (![1, 2, 3, 4, 5].includes(rating)) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }
    return await sequelize.transaction(async (transaction: Transaction) => {
      const newRating = await Rating.create({ userId, postId, rating }, { transaction });
      return newRating;
    });
  }

  // [Update Rating]
  static async updateRating(userId: string, postId: string, rating: number) {
    if (![1, 2, 3, 4, 5].includes(rating)) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }
    return await sequelize.transaction(async (transaction: Transaction) => {
      const existingRating = await Rating.findOne({ where: { userId, postId }, transaction });
      if (!existingRating) {
        throw new NotFoundError("Rating not found");
      }
      await existingRating.update({ rating }, { transaction });
      return existingRating;
    });
  }

  // [Delete Rating]
  static async deleteRating(userId: string, postId: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const rating = await Rating.findOne({ where: { userId, postId }, transaction });
      if (!rating) {
        throw new NotFoundError("Rating not found");
      }
      await rating.destroy({ transaction });
      return { message: "Rating deleted successfully" };
    });
  }

  // [Get Ratings by PostId]
  static async getRatingsByPostId(postId: string) {
    const cacheKey = `ratings:post:${postId}`;
    const cachedData = await CacheRepository.get(cacheKey);
    if (cachedData) {
      console.log("✅ Fetching ratings from cache");
      return JSON.parse(cachedData);
    }
    const ratings = await Rating.findAll({ where: { postId } });
    await CacheRepository.set(cacheKey, JSON.stringify(ratings), 300); 
    return ratings;
  }
}

export default RatingService;
