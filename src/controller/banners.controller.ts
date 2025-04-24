"use strict";
import { Request, Response, NextFunction } from "express";
import { BannerService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class BannerController {
  static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const imageUrls = imageFiles ? imageFiles.map((file) => file.path) : [];
      
      const newBanner = await BannerService.createBanner({
        ...req.body,
        imageUrls
      });
      
      return res.status(201).json(ApiResponse.success(newBanner, "Banner created successfully!"));
    } catch (error) {
      next(error);
    }
  }

    // [getAllBanners]
  static async getAllBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await BannerService.getAllBanners();
      return res.status(200).json(ApiResponse.success(banners, "Banners retrieved successfully!"));
    } catch (error) {
      next(error);
    }
  }

    // [getBannerById]
  static async getBannerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { bannerId } = req.params;
      const banner = await BannerService.getBannerById(bannerId);
      return res.status(200).json(ApiResponse.success(banner, "Banner retrieved successfully!"));
    } catch (error) {
      next(error);
    }
  }

  // [updateBanner]
  static async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { bannerId } = req.params;
      const imageFiles = req.files as Express.Multer.File[];
      const imageUrls = imageFiles ? imageFiles.map((file) => file.path) : undefined;
      
      const updatedBanner = await BannerService.updateBanner(bannerId, {
        ...req.body,
        imageUrls
      });
      
      return res.status(200).json(ApiResponse.success(updatedBanner, "Banner updated successfully!"));
    } catch (error) {
      next(error);
    }
  }

  // [deleteBanner]
  static async deleteBanner(req: Request, res: Response, next: NextFunction) {
    const { bannerId } = req.params;
    try {
      await BannerService.deleteBanner(bannerId);
      return res.status(200).json(ApiResponse.success(null, "Banner deleted successfully!"));
    } catch (error) {
      next(error);
    }
  }


}

export default BannerController;
