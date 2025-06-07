import express, { Request, Response } from "express";
import { verifyRole,paginationMiddleware, allowIfAuthenticatedWithRoleOrPublic} from "@middleware";
import {CommentController} from '@controller';
import {validatorUpdateComment, validatorCreateComment, validatorReplyToComment } from "@validation";
import { Roles } from "@models/enums";
const Router = express.Router();

Router.post('/createComment', validatorCreateComment, verifyRole([Roles.User, Roles.Agent]),  CommentController.createComment as any);
Router.get('/:postId/getCommentByPostId',allowIfAuthenticatedWithRoleOrPublic([Roles.User, Roles.Agent]) , paginationMiddleware,CommentController.getCommentsByPost as any);
Router.put('/:commentId/updateComment',validatorUpdateComment, verifyRole([Roles.User, Roles.Agent]), CommentController.updateComment as any);
Router.delete('/:commentId/deleteComment', verifyRole([Roles.User, Roles.Agent]), CommentController.deleteComment as any);
Router.post("/reply", validatorReplyToComment, verifyRole([Roles.User, Roles.Agent]), CommentController.replyToComment as any);
Router.get("/:commentId/replies",allowIfAuthenticatedWithRoleOrPublic([Roles.User, Roles.Agent]), CommentController.getReplies as any);


export default Router;
