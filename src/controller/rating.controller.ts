"use strict";
import { Rating } from "@models";
import { Request, Response, NextFunction } from "express";
import { RatingService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class RatingController {
  // [Create Rating]
  static async createRating(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { postId, rating } = req.body;
      const numericRating = Number(rating);
      const newRating = await RatingService.createRating(userId, postId, numericRating);
      return res.status(201).json(ApiResponse.success(newRating, "Rating created successfully"));
    } catch (error) {
      next(error);
    }
  }

  // [Update Rating]
  static async updateRating(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { ratingId } = req.params;
      const { rating } = req.body;
      if (!ratingId || !rating) {
        throw new BadRequestError("Missing ratingId or rating");
      }
      const updatedRating = await RatingService.updateRating(ratingId, userId, rating);
      return res.status(200).json(ApiResponse.success(updatedRating, "Rating updated successfully"));
    } catch (error) {
      next(error);
    }
  }


  // [Delete Rating]
  static async deleteRating(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { ratingId } = req.params;
      await RatingService.deleteRating(userId, ratingId);
      return res.status(200).json(ApiResponse.success(null, "Rating deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // [Get Ratings by PostId]
  static async getRatingsByPostId(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const ratings = await RatingService.getRatingsByPostId(postId);
      return res.status(200).json(ApiResponse.success(ratings, "Ratings fetched successfully"));
    } catch (error) {
      next(error);
    }
  }


}


export default RatingController;