import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Comment, CommentLike } from "@models";
import User from "@models/user.model";
import Post from "@models/post.model";
import { CommentStatus, LikeStatus } from "@models/enums";

const createCommentsRecursive = async (
  parentId: string | null,
  level: number,
  maxLevel: number,
  commentsData: any[],
  users: any[],
  post: any
) => {
  if (level > maxLevel) return;

  const commentCount = level === 1 ? faker.number.int({ min: 2, max: 5 }) : faker.number.int({ min: 1, max: 3 });

  const commentTemplates = level === 1
    ? [
        () => `Bất động sản "${post.title}" này còn không? Tôi muốn xem chi tiết.`,
        () => `Giá ${post.price.toLocaleString('vi-VN')} VND có thương lượng được không?`,
        () => `Vị trí ${post.address} có gần trung tâm thương mại không?`,
        () => `Tôi quan tâm đến "${post.title}". Có thể xem nhà vào cuối tuần này không?`,
        () => `Bất động sản này có pháp lý rõ ràng không? Vui lòng cung cấp thêm thông tin.`,
      ]
    : [
        () => `Bạn có thể liên hệ qua số ${faker.phone.number()} để trao đổi thêm.`,
        () => `Tôi đã xem "${post.title}" và thấy phù hợp. Giá có giảm thêm được không?`,
        () => `Cảm ơn thông tin! Có hình ảnh thực tế của bất động sản này không?`,
        () => `Vị trí này khá tốt, bạn có thể gửi thêm thông tin về tiện ích xung quanh không?`,
        () => `Tôi cũng quan tâm, bạn có thể cho biết thêm về phí quản lý không?`,
      ];

  for (let i = 0; i < commentCount; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const commentId = uuidv4();
    const template = faker.helpers.arrayElement(commentTemplates);
    const content = template();
    const createdAt = faker.date.past({ years: 1 });
    const updatedAt = new Date();

    const newComment = {
      id: commentId,
      userId: randomUser.id,
      postId: post.id,
      content,
      status: CommentStatus.ACTIVE,
      parentId,
      level,
      createdAt,
      updatedAt,
    };

    commentsData.push(newComment);

    // Recursively create replies
    await createCommentsRecursive(commentId, level + 1, maxLevel, commentsData, users, post);
  }
};

export const seedComments = async () => {
  try {
    const users = await User.findAll();
    if (!users || users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    const posts = await Post.findAll();
    if (!posts || posts.length === 0) {
      throw new Error('No posts found. Please seed posts first.');
    }

    const commentsData: any[] = [];
    const totalPostsToComment = Math.min(50, posts.length);

    for (let i = 0; i < totalPostsToComment; i++) {
      const randomPost = faker.helpers.arrayElement(posts);
      await createCommentsRecursive(null, 1, 3, commentsData, users, randomPost);
    }

    // Batch create comments
    const batchSize = 100;
    for (let i = 0; i < commentsData.length; i += batchSize) {
      const batch = commentsData.slice(i, i + batchSize);
      await Comment.bulkCreate(batch, { validate: true });
      console.log(`✅ Đã tạo ${i + batch.length}/${commentsData.length} bình luận`);
    }

    console.log('🎉 Hoàn tất tạo bình luận!');
  } catch (error) {
    console.error('Lỗi khi chạy seedComments:', error);
    throw error;
  }
};

export const seedCommentLikes = async () => {
  try {
    const users = await User.findAll();
    if (!users || users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    const comments = await Comment.findAll();
    if (!comments || comments.length === 0) {
      throw new Error('No comments found. Please seed comments first.');
    }

    const commentLikesData = [];
    for (const comment of comments) {
      const numberOfLikes = comment.level === 1
        ? faker.number.int({ min: 2, max: 15 })
        : faker.number.int({ min: 0, max: 5 });

      const selectedUsers = faker.helpers.shuffle(users).slice(0, numberOfLikes);

      for (const user of selectedUsers) {
        commentLikesData.push({
          id: uuidv4(),
          userId: user.id,
          commentId: comment.id,
          status: LikeStatus.LIKE,
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: new Date(),
        });
      }
    }

    const batchSize = 100;
    for (let i = 0; i < commentLikesData.length; i += batchSize) {
      const batch = commentLikesData.slice(i, i + batchSize);
      await CommentLike.bulkCreate(batch, { validate: true });
      console.log(`✅ Đã tạo ${i + batch.length}/${commentLikesData.length} lượt thích bình luận`);
    }

    console.log('🎉 Hoàn tất tạo lượt thích bình luận!');
  } catch (error) {
    console.error('Lỗi khi chạy seedCommentLikes:', error);
    throw error;
  }
};