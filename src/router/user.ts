import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyAdmin ,verifyUser} from "@middleware";
import {UserController} from '@controller';

Router.get("/getAllUser",verifyAdmin, UserController.getAllUser as any);
Router.get("/:userId/getUser",verifyUser, UserController.getUserById as any);
Router.put("/:userId/updateUser",verifyUser, UserController.updateUser as any);

export default Router;
