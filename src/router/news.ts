import express, { Request, Response } from "express";
const Router = express.Router();

import {NewController } from "@controller";
import { verifyRole,paginationMiddleware} from "@middleware";
import uploadCloud from "@config/cloudinary.config";
import {validatorCreateNews, validatorUpdateNews } from "@validation";
import { Roles } from "@models/enums";



Router.post("/createNew",uploadCloud.single("image"),validatorCreateNews, verifyRole([Roles.User]),NewController.createNew as any);
Router.get("/getAllNew",paginationMiddleware, NewController.getAllNews as any);
Router.get("/:slug/getNews", NewController.getNews as any);
Router.delete("/:newsId/delete", verifyRole([Roles.User]), NewController.deleteNews as any);
Router.put("/:newsId/update", uploadCloud.single("image"), validatorUpdateNews, verifyRole([Roles.User]), NewController.updateNews as any);
Router.get("/findNews",paginationMiddleware, NewController.findNews as any);


export default Router;