import { v4 as uuidv4 } from "uuid";
import {Comment,CommentLike} from "@models";
import User from "@models/user.model";
import Post from "@models/post.model";
import { CommentStatus, LikeStatus } from "@models/enums";



import { faker } from "@faker-js/faker";

const createCommentsRecursive = async (
  parentId: string | null,
  level: number,
  maxLevel: number,
  commentsData: any[],
  users: any[],
  post: any
) => {
  if (level > maxLevel) return;

  const commentCount = level === 1 ? 3 : 2;

  for (let i = 0; i < commentCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const commentId = uuidv4();

    const content = faker.lorem.sentences(faker.number.int({ min: 1, max: 2 }));

    const newComment = {
      id: commentId,
      userId: randomUser.id,
      postId: post.id,
      content,
      status: CommentStatus.ACTIVE,
      parentId,
      level,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commentsData.push(newComment);

    await createCommentsRecursive(commentId, level + 1, maxLevel, commentsData, users, post);
  }
};



export const seedComments = async () => {
  const users = await User.findAll();
  const posts = await Post.findAll();
  const commentsData: any[] = [];

  for (let i = 0; i < 50; i++) {
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    await createCommentsRecursive(
      null,
      1,
      3,
      commentsData,
      users,
      randomPost
    );
  }

  await Comment.bulkCreate(commentsData);
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