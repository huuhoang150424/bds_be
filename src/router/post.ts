import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole,paginationMiddleware} from "@middleware";
import {PostController,PostDraftController} from '@controller';
import uploadCloud from "@config/cloudinary.config";
import {validateCreatePost,validateCreatePostDraft} from "@validation";



Router.post("/createPost",uploadCloud.array("images"),validateCreatePost,verifyRole(["Agent","User"]), PostController.create as any);
Router.get("/:slug/getPost", PostController.getPost as any);
Router.get("/getAllPosts",verifyRole(["Admin"]),paginationMiddleware, PostController.getAllPost as any);
Router.put("/:postId/updatePost",uploadCloud.array("images"),verifyRole(["Agent","User"]), PostController.updatePost as any);
Router.delete("/:postId/deletePost",verifyRole(["Agent"]), PostController.deletePost as any);
Router.patch("/:postId/approvePost", verifyRole(["Admin"]),PostController.approvePost as any);
Router.get("/searchPost",paginationMiddleware,PostController.searchPost as any);

//get post
Router.get("/getPostClient",paginationMiddleware, PostController.getAllPostForClient as any);
Router.get("/getPostOutstanding", PostController.getPostOutstanding as any);
Router.get("/getPostHabit", verifyRole(["Agent","User"]),PostController.getPostHabit as any);
Router.get("/filterPost", paginationMiddleware,PostController.filterPost as any);

//post draft
Router.post("/createPostDraft",uploadCloud.array("images"),validateCreatePostDraft,verifyRole(["Agent","User"]), PostDraftController.create as any);
Router.get("/:postDraftId/getPostDraft",verifyRole(["Agent","User"]),paginationMiddleware, PostDraftController.getPostDraft as any);
Router.get("/getAllPostDraft",verifyRole(["Agent","User"]), PostDraftController.getAllPostDraft as any);
Router.delete("/:postDraftId/deletePostDraft",verifyRole(["Agent","User"]), PostDraftController.deletePostDraft as any);
Router.put("/:postDraftId/updatePostDraft",uploadCloud.array("images"),verifyRole(["Agent","User"]), PostDraftController.updatePostDraft as any);
Router.post("/:postDraftId/publicPostDraft",uploadCloud.array("images"),verifyRole(["Agent","User"]), PostDraftController.publicPostDraft as any);

export default Router;