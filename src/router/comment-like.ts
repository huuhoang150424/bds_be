import express from 'express';
import { verifyRole } from '@middleware';
import { CommentLikeController } from '@controller';

const Router = express.Router();

Router.post('/like', verifyRole(['User']), CommentLikeController.likeComment as any);
Router.post('/dislike', verifyRole(['User']), CommentLikeController.dislikeComment as any);
Router.get('/:commentId/reactions', CommentLikeController.getCommentReactionCount as any);

export default Router;
