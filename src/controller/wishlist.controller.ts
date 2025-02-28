import { Request, Response, NextFunction } from "express";
import { WishlistService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class WishlistController {
  // [addToWishlist]
  static async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, postId } = req.body;
      if (!userId || !postId) {
        throw new BadRequestError("Missing required fields: userId or postId.");
      }
      const wishlistId = await WishlistService.addToWishlist(userId, postId);
      return res.status(201).json(new ApiResponse(201, wishlistId, "Added to wishlist successfully"));
    } catch (error) {
      next(error);
    }
  }

  // [removeFromWishlist]
  static async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, postId } = req.body;
      if (!userId || !postId) {
        throw new BadRequestError("Missing required fields: userId or postId.");
      }
      await WishlistService.removeFromWishlist(userId, postId);
      return res.status(200).json(new ApiResponse(200, "Removed from wishlist successfully", null));
    } catch (error) {
      next(error);
    }
  }

  // [getUserWishlist]
  static async getUserWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      if (!userId) {
        throw new BadRequestError("User ID is required.");
      }
      const wishlist = await WishlistService.getUserWishlist(userId);
      return res.status(200).json(new ApiResponse(200,  "Wishlist retrieved successfully", wishlist));
    } catch (error) {
      next(error);
    }
  }
}

export default WishlistController;
