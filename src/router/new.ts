import express, { Request, Response } from "express";
const Router = express.Router();
import {NewController } from "@controller";
import { verifyRole } from "@middleware";
import uploadCloud from "@config/cloudinary.config";
import {validatorCreateNews, validatorUpdateNews } from "@validation";

Router.post("/createNew",uploadCloud.single("image"),validatorCreateNews, verifyRole(["User"]),NewController.createNew as any);
Router.get("/news/getAllNew", NewController.getAllNews as any);
Router.delete("/news/:newsId/delete", verifyRole(["User"]), NewController.deleteNews as any);


export default Router;