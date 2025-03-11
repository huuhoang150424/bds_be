import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {CommentController} from '@controller';
import {validatorUpdateComment, validatorCreateComment } from "@validation";
const Router = express.Router();

Router.post('/createComment', validatorCreateComment, verifyRole(["User"]),  CommentController.createComment as any);
Router.get('/:postId/getCommentByPostId', CommentController.getCommentsByPost as any);
Router.put('/:commentId/updateComment',validatorUpdateComment, verifyRole(["User"]), CommentController.updateComment as any);
Router.delete('/:commentId/deleteComment', verifyRole(["User"]), CommentController.deleteComment as any);
Router.post("/:commentId/reply", verifyRole(["User"]), CommentController.replyToComment as any);
Router.get("/:commentId/replies", verifyRole(["User"]), CommentController.getReplies as any);


export default Router;
