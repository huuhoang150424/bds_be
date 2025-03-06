import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {CommentLikeController} from '@controller';
const Router = express.Router();

Router.post("/like", verifyRole(["User"]), CommentLikeController.likeComment as any);
Router.post("/unlike", verifyRole(["User"]), CommentLikeController.unlikeComment as any);
Router.get("/:commentId/getlike", CommentLikeController.getCommentLikesCount as any);

export default Router;
