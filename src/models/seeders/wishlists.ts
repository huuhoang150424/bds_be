import { v4 as uuidv4 } from "uuid";
import Wishlist from "@models/wish-list.model";
import User from "@models/user.model";
import Post from "@models/post.model";

export const seedWishlists = async () => {
  const users = await User.findAll();
  const posts = await Post.findAll();
  const wishlistsData = [];
  for (let i = 0; i < 500; i++) { // Tạo 500 wishlist
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomPost = posts[Math.floor(Math.random() * posts.length)];

    wishlistsData.push({
      id: uuidv4(),
      userId: randomUser.id,
      postId: randomPost.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await Wishlist.bulkCreate(wishlistsData);
};