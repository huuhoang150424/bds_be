import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {CommentController} from '@controller';
const Router = express.Router();

Router.post('/createComment',  verifyRole(["User"]),  CommentController.createComment as any);
Router.get('/:postId/getCommentByPostId', CommentController.getCommentsByPost as any);
Router.put('/:commentId/updateComment', verifyRole(["User"]), CommentController.updateComment as any);
Router.delete('/:commentId/deleteComment', verifyRole(["User"]), CommentController.deleteComment as any);


export default Router;
