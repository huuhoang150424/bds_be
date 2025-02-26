import express, { Request, Response } from "express";
const Router = express.Router();

import {NewController } from "@controller";
import { verifyRole } from "@middleware";
import uploadCloud from "@config/cloudinary.config";
import {validatorCreateNews, validatorUpdateNews } from "@validation";



Router.post("/createNew",uploadCloud.single("image"),validatorCreateNews, verifyRole(["User"]),NewController.createNew as any);
Router.get("/getAllNew", NewController.getAllNews as any);
Router.get("/:slug/getNews",verifyRole(["User"]), NewController.getNews as any);
Router.delete("/:newsId/delete", verifyRole(["User"]), NewController.deleteNews as any);


export default Router;