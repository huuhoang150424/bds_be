import express from 'express';
import { verifyRole } from '@middleware';
import { CommentLikeController } from '@controller';
import { Roles } from '@models/enums';

const Router = express.Router();

Router.post('/like', verifyRole([Roles.User]), CommentLikeController.likeComment as any);
Router.post('/dislike', verifyRole([Roles.User]), CommentLikeController.dislikeComment as any);
Router.get('/:commentId/reactions', CommentLikeController.getCommentReactionCount as any);

export default Router;
