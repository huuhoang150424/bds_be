'use strict';
import { Banner } from '@models';
import { NotFoundError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';

class BannerService {
  static async createBanner(data: any) {
    try {
      const { title, targetUrl, displayOrder, isActive, startDate, endDate, imageUrls } = data;
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (endDateObj <= startDateObj) {
        throw new BadRequestError('End date must be after start date');
      }

      const newBanner = await Banner.create({
        id: uuidv4(),
        title,
        imageUrls,
        targetUrl,
        displayOrder: Number(displayOrder),
        isActive: isActive === 'true' || isActive === true ? true : false,
        startDate: startDateObj,
        endDate: endDateObj,
      });

      return newBanner.toJSON();
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(`Failed to create banner: ${(error as Error).message}`);
    }
  }

  //[getAllBanners]
  static async getAllBanners( page: number, limit: number, offset: number ) {
    try {
      const { rows, count } = await Banner.findAndCountAll({
        limit,
        offset,
        order: [['displayOrder', 'ASC']],
      });

      return {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      };
    } catch (error) {
      throw new BadRequestError(`Failed to retrieve banners: ${(error as Error).message}`);
    }
  }

  //[getBannerById]
  static async getBannerById(bannerId: string) {
    try {
      const banner = await Banner.findByPk(bannerId);

      if (!banner) {
        throw new NotFoundError('Banner not found');
      }

      return banner.toJSON();
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError(`Failed to retrieve banner: ${(error as Error).message}`);
    }
  }

  //[updateBanner]
  static async updateBanner(bannerId: string, updateData: any) {
    try {
      const banner = await Banner.findByPk(bannerId);

      if (!banner) {
        throw new NotFoundError('Banner not found');
      }
      const dataToUpdate: any = {};

      if (updateData.title !== undefined) {
        dataToUpdate.title = updateData.title;
      }

      if (updateData.targetUrl !== undefined) {
        dataToUpdate.targetUrl = updateData.targetUrl;
      }

      if (updateData.displayOrder !== undefined) {
        dataToUpdate.displayOrder = Number(updateData.displayOrder);
      }

      if (updateData.isActive !== undefined) {
        dataToUpdate.isActive = updateData.isActive === 'true' || updateData.isActive === true ? true : false;
      }

      if (updateData.imageUrls !== undefined) {
        dataToUpdate.imageUrls = updateData.imageUrls;
      }

      if (updateData.startDate && updateData.endDate) {
        const startDateObj = new Date(updateData.startDate);
        const endDateObj = new Date(updateData.endDate);

        if (endDateObj <= startDateObj) {
          throw new BadRequestError('End date must be after start date');
        }

        dataToUpdate.startDate = startDateObj;
        dataToUpdate.endDate = endDateObj;
      } else if (updateData.startDate) {
        const startDateObj = new Date(updateData.startDate);
        const currentEndDate = banner.endDate;

        if (currentEndDate <= startDateObj) {
          throw new BadRequestError('End date must be after start date');
        }

        dataToUpdate.startDate = startDateObj;
      } else if (updateData.endDate) {
        const endDateObj = new Date(updateData.endDate);
        const currentStartDate = banner.startDate;

        if (endDateObj <= currentStartDate) {
          throw new BadRequestError('End date must be after start date');
        }

        dataToUpdate.endDate = endDateObj;
      }

      await banner.update(dataToUpdate);

      const updatedBanner = await Banner.findByPk(bannerId);

      if (!updatedBanner) {
        throw new NotFoundError('Banner not found after update');
      }

      return updatedBanner.toJSON();
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(`Failed to update banner: ${(error as Error).message}`);
    }
  }

  //[deleteBanner]
  static async deleteBanner(bannerId: string) {
    try {
      const banner = await Banner.findByPk(bannerId);

      if (!banner) {
        throw new NotFoundError('Banner not found');
      }
      await banner.destroy();
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError(`Failed to delete banner: ${(error as Error).message}`);
    }
  }
}

export default BannerService;
