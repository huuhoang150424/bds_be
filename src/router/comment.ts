import express, { Request, Response } from "express";
import { verifyRole,paginationMiddleware} from "@middleware";
import {CommentController} from '@controller';
import {validatorUpdateComment, validatorCreateComment, validatorReplyToComment } from "@validation";
const Router = express.Router();

Router.post('/createComment', validatorCreateComment, verifyRole(["User"]),  CommentController.createComment as any);
Router.get('/:postId/getCommentByPostId', paginationMiddleware,CommentController.getCommentsByPost as any);
Router.put('/:commentId/updateComment',validatorUpdateComment, verifyRole(["User"]), CommentController.updateComment as any);
Router.delete('/:commentId/deleteComment', verifyRole(["User"]), CommentController.deleteComment as any);
Router.post("/reply", validatorReplyToComment, verifyRole(["User"]), CommentController.replyToComment as any);
Router.get("/:commentId/replies", CommentController.getReplies as any);


export default Router;
