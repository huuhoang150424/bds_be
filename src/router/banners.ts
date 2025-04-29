import express, { Request, Response } from "express";
const Router = express.Router();
import { paginationMiddleware, verifyRole} from "@middleware";
import {BannerController} from '@controller';
import {validatorCreateBanner, validatorUpdateBanner} from "@validation";
import uploadCloud from "@config/cloudinary.config";
import { Roles } from "@models/enums";


Router.post("/createBanner",uploadCloud.array("images"),validatorCreateBanner, verifyRole([Roles.Admin]), BannerController.createBanner as any);
Router.get("/getAllBanners",paginationMiddleware ,BannerController.getAllBanners as any );
Router.get("/:bannerId/getBannerById", BannerController.getBannerById as any);
Router.put("/:bannerId/updateBanner",uploadCloud.array("images"),validatorUpdateBanner, verifyRole([Roles.Admin]), BannerController.updateBanner as any);
Router.delete("/:bannerId/deleteBanner", verifyRole([Roles.Admin]), BannerController.deleteBanner as any);
export default Router;