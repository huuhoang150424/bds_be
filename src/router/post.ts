import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole,paginationMiddleware, allowIfAuthenticatedWithRoleOrPublic} from "@middleware";
import {PostController,PostDraftController} from '@controller';
import uploadCloud from "@config/cloudinary.config";
import {validateCreatePost,validateCreatePostDraft} from "@validation";
import { Roles } from "@models/enums";



Router.post("/createPost",uploadCloud.array("images"),validateCreatePost,verifyRole([Roles.Agent,Roles.User]), PostController.create as any);
Router.get("/:slug/getPost",allowIfAuthenticatedWithRoleOrPublic([Roles.User, Roles.Agent]) , PostController.getPost as any);
Router.get("/getAllPosts",verifyRole([Roles.Admin]),paginationMiddleware, PostController.getAllPost as any);
Router.put("/:postId/updatePost",uploadCloud.array("images"),verifyRole([Roles.Agent,Roles.User]), PostController.updatePost as any);
Router.delete("/:postId/deletePost",verifyRole([Roles.Agent]), PostController.deletePost as any);
Router.post("/bulkApprovePost", verifyRole([Roles.Admin]),PostController.bulkApprovePosts as any);
Router.post("/bulkAiApprovePosts", verifyRole([Roles.Admin]),PostController.bulkAiApprovePosts as any);
Router.post("/bulkRejectPost", verifyRole([Roles.Admin]), PostController.bulkRejectPosts as any);
Router.get("/searchPost",paginationMiddleware,PostController.searchPost as any);

Router.post('/delete', verifyRole([Roles.Admin]), PostController.deletePosts as any);

Router.post("/createListingType", verifyRole([Roles.Admin]),PostController.createListingType as any);
Router.delete("/:id/deleteListingType", verifyRole([Roles.Admin]),PostController.deleteListingType as any);
Router.put("/:id/updateListingType", verifyRole([Roles.Admin]),PostController.updateListingType as any);

//get post
Router.get("/getPostClient",paginationMiddleware, PostController.getAllPostForClient as any);
Router.get("/getPostOutstanding", PostController.getPostOutstanding as any);
Router.get("/getPostHabit", verifyRole([Roles.Agent,Roles.User]),PostController.getPostHabit as any);
Router.get("/filterPost", paginationMiddleware,PostController.filterPost as any);

Router.get("/postCountByLocation",PostController.getPostCountByLocation as any);
Router.get("/postsByMapBounds/:address",paginationMiddleware,PostController.getPostsByMapBounds as any);
Router.get("/topPostsByMonth",PostController.getTopPostsByMonth as any);


Router.get("/myPost/:type",verifyRole([Roles.Agent,Roles.User]), paginationMiddleware,PostController.getAllPostByUser as any);
Router.get("/:userId/getPostTarget",PostController.getAllPostTarget as any);

//post draft
Router.post("/createPostDraft",uploadCloud.array("images"),validateCreatePostDraft,verifyRole([Roles.Agent,Roles.User]), PostDraftController.create as any);
Router.get("/:postDraftId/getPostDraft",verifyRole([Roles.Agent,Roles.User]),paginationMiddleware, PostDraftController.getPostDraft as any);
Router.delete("/:postDraftId/deletePostDraft",verifyRole([Roles.Agent,Roles.User]), PostDraftController.deletePostDraft as any);
Router.put("/:postDraftId/updatePostDraft",uploadCloud.array("images"),verifyRole([Roles.Agent,Roles.User]), PostDraftController.updatePostDraft as any);
Router.post("/:postDraftId/publicPostDraft",uploadCloud.array("images"),verifyRole([Roles.Agent,Roles.User]), PostDraftController.publicPostDraft as any);


// getListingTypes 
Router.get("/getListingTypes", PostController.getListingTypes as any);

export default Router;