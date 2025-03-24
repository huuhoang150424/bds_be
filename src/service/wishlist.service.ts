'use strict';
import { Wishlist, Post } from "@models";
import { NotFoundError, BadRequestError } from "@helper";
import { v4 as uuidv4 } from "uuid";

class WishlistService {
  static async addToWishlist(userId: string, postId: string) {
    const postExists = await Post.findByPk(postId);
    if (!postExists) {
      throw new NotFoundError("Post not found");
    }
    const existingWishlistItem = await Wishlist.findOne({ where: { userId, postId } });
    if (existingWishlistItem) {
      throw new BadRequestError("Post is already in wishlist");
    }
    const wishlist = await Wishlist.create({
      id: uuidv4(),
      userId,
      postId,
    });
    return wishlist.id;
  }

  static async removeFromWishlist(userId: string, postId: string) {
    const wishlistItem = await Wishlist.findOne({ where: { userId, postId } });
    if (!wishlistItem) {
      throw new NotFoundError("Wishlist item not found");
    }

    await wishlistItem.destroy();
  }

  static async getUserWishlist(userId: string) {
    return await Wishlist.findAll({
      where: { userId },
      include: ["post"],
    });
  }
}

export default WishlistService;
