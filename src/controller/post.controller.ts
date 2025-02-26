'use-strict';

import {ApiResponse} from "@helper";
import {PostService} from "@service";
import { Request, Response, NextFunction } from 'express';



class PostController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
			const imageFiles = req.files as Express.Multer.File[];
			console.log(imageFiles);


			await PostService.createPost()

			
      return res.status(200).json(
        ApiResponse.success(
          {

          },
          "thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {  } = req.body;


      return res.status(200).json(
        ApiResponse.success(
          {

          },
          "thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }
	static async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const {  } = req.body;


      return res.status(200).json(
        ApiResponse.success(
          {

          },
          "thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }
	static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const {  } = req.body;


      return res.status(200).json(
        ApiResponse.success(
          {

          },
          "thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }
	static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const {  } = req.body;


      return res.status(200).json(
        ApiResponse.success(
          {

          },
          "thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }

}


export default PostController;