import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole,paginationMiddleware} from "@middleware";
import {UserController} from '@controller';
import uploadCloud from "@config/cloudinary.config";

Router.get("/getAllUser",verifyRole(["Admin"]),paginationMiddleware, UserController.getAllUser as any);
Router.get("/:userId/getUser",verifyRole(["User","Agent"]), UserController.getUserById as any);
Router.put("/:userId/updateUser",uploadCloud.single("image"),verifyRole(["User","Agent"]), UserController.updateUser as any);
Router.patch("/:userId/unLockUser",verifyRole(["Admin"]), UserController.unLockUser as any);
export default Router;
