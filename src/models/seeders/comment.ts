import { v4 as uuidv4 } from "uuid";
import {Comment,CommentLike} from "@models";
import User from "@models/user.model";
import Post from "@models/post.model";
import { CommentStatus, LikeStatus } from "@models/enums";



const createCommentsRecursive = async (
  parentId: string | null, 
  level: number, 
  maxLevel: number,
  commentsData: any[], 
  repliesData: any[],
  users: any[], 
  posts: any[],
  maxReplies: number = 5, 
  maxSubReplies: number = 3
) => {
  if (level > maxLevel) return; 
  const randomUser = users[Math.floor(Math.random() * users.length)];
  const randomPost = posts[Math.floor(Math.random() * posts.length)];

  const commentId = uuidv4();
  const content = `Bình luận cấp ${level}: Đây là một bài viết tuyệt vời!`;

  const newComment = {
    id: commentId,
    userId: randomUser.id,
    postId: randomPost.id,
    content,
    status: CommentStatus.ACTIVE,
    parentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (level === 0) {
    commentsData.push(newComment);
  } else {
    repliesData.push(newComment); 
  }

  const numberOfReplies = level === 0 ? maxReplies : maxSubReplies;
  for (let i = 0; i < numberOfReplies; i++) {
    await createCommentsRecursive(commentId, level + 1, maxLevel, commentsData, repliesData, users, posts);
  }
};

export const seedComments = async () => {
  const users = await User.findAll();
  const posts = await Post.findAll();
  const commentsData: any[] = [];
  const repliesData: any[] = [];
  for (let i = 0; i < 100; i++) {
    await createCommentsRecursive(
      null,
      0, 
      3, 
      commentsData,
      repliesData,
      users,
      posts
    );
  }
  await Comment.bulkCreate(commentsData);
  await Comment.bulkCreate(repliesData);
};


export const seedCommentLikes = async () => {
  const users = await User.findAll();
  const comments = await Comment.findAll(); 

  const commentLikesData = [];

  for (const comment of comments) {
    const numberOfLikes = Math.floor(Math.random() * 10) + 1; 

    for (let i = 0; i < numberOfLikes; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      commentLikesData.push({
        id: uuidv4(),
        userId: randomUser.id,
        commentId: comment.id,
        status: LikeStatus.LIKE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  await CommentLike.bulkCreate(commentLikesData);
};