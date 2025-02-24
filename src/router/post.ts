import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import {PostController} from '@controller';
import uploadCloud from "@config/cloudinary.config";



Router.post("/createPost",verifyRole(["Agent"]),uploadCloud.array("images"), PostController.create as any);
Router.get("/:postId/getPost",verifyRole(["Agent"]), PostController.getPost as any);

export default Router;