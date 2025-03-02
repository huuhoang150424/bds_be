import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import {PostController,PostDraftController} from '@controller';
import uploadCloud from "@config/cloudinary.config";
import {validateCreatePost} from "@validation";



Router.post("/createPost",uploadCloud.array("images"),validateCreatePost,verifyRole(["Agent","User"]), PostController.create as any);
Router.get("/:slug/getPost", PostController.getPost as any);
Router.get("/getAllPosts",verifyRole(["Admin"]), PostController.getAllPost as any);
Router.put("/:postId/updatePost",uploadCloud.array("images"),verifyRole(["Agent","User"]), PostController.updatePost as any);
Router.delete("/:postId/deletePost",verifyRole(["Agent"]), PostController.deletePost as any);
Router.get("/getPostClient", PostController.getAllPostForClient as any);
Router.patch("/:postId/approvePost", verifyRole(["Admin"]),PostController.approvePost as any);
Router.get("/searchPost",PostController.searchPost as any);

//post draft
Router.post("/createPostDraft",uploadCloud.array("images"),verifyRole(["Agent","User"]), PostDraftController.create as any);


export default Router;