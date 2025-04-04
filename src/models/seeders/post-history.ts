import { v4 as uuidv4 } from "uuid";
import { PostHistory, Post, User } from "@models";
import { ActionType, Directions, StatusPost, PriceUnit } from "@models/enums";

export const seedPostHistory = async () => {
  const posts = await Post.findAll();
  const users = await User.findAll();

  if (posts.length === 0 || users.length === 0) {
    console.log("Cần có ít nhất một user và một post trong database.");
    return;
  }

  const postHistoryData = [];
  const updatesPerPost = 20; 

  for (const post of posts) {
    let currentPrice = post.price;
    let isFirstChange = true; 

    for (let i = 0; i <= updatesPerPost; i++) { 
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const changedAt = new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000) 
      );
      const action = isFirstChange ? ActionType.CREATE : ActionType.UPDATE;
      if (action === ActionType.UPDATE) {
        const priceChange = currentPrice * (0.1 + Math.random() * 0.1);
        const newPrice = Math.random() > 0.5 ? currentPrice + priceChange : currentPrice - priceChange;
        currentPrice = Math.max(1000000000, newPrice);
      }

      postHistoryData.push({
        id: uuidv4(),
        postId: post.id,
        userId: randomUser.id,
        priceUnit: post.priceUnit,
        title: post.title,
        address: post.address,
        price: currentPrice,
        squareMeters: post.squareMeters,
        priority: post.priority,
        description: post.description || (action === ActionType.CREATE ? "Tạo bài đăng mới" : "Cập nhật thông tin bài đăng"),
        floor: post.floor,
        bedroom: post.bedroom,
        bathroom: post.bathroom,
        isFurniture: post.isFurniture,
        slug: post.slug,
        direction: post.direction || Directions.East,
        verified: post.verified,
        expiredDate: post.expiredDate,
        status: post.status || StatusPost.Available,
        action: action,
        changeBy: randomUser.id,
        changedAt: changedAt,
      });

      isFirstChange = false; 
    }
  }

  postHistoryData.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  await PostHistory.bulkCreate(postHistoryData);
};