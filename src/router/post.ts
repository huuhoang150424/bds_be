import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyAdmin ,verifyAgent} from "@middleware";
import {PostController} from '@controller';
import uploadCloud from "@config/cloudinary.config";



Router.post("/createPost",verifyAgent,uploadCloud.array("images"), PostController.create as any);
Router.get("/:postId/getPost",verifyAgent, PostController.getPost as any);

export default Router;