import { Request, Response, NextFunction } from "express";
import { WishlistService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class WishlistController {
  // [addToWishlist]
  static async addToWishlist(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { postId } = req.body;
    try {
      const wishlistId = await WishlistService.addToWishlist(userId, postId);
      return res.status(201).json(new ApiResponse(201, wishlistId, "Tim bài đăng thành công"));
    } catch (error) {
      next(error);
    }
  }

  // [removeFromWishlist]
  static async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { postId } = req.body;
    try {
      await WishlistService.removeFromWishlist(userId, postId);
      return res.status(200).json(new ApiResponse(200, "Xóa bài đăng thành công", null));
    } catch (error) {
      next(error);
    }
  }

  // [getUserWishlist]
  static async getUserWishlist(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    try {
      const wishlist = await WishlistService.getUserWishlist(userId);
      return res.status(200).json(new ApiResponse(200, "Wishlist retrieved successfully", wishlist));
    } catch (error) {
      next(error);
    }
  }
}

export default WishlistController;
