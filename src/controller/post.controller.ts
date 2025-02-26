'use-strict';

import {ApiResponse} from "@helper";
import {PostService} from "@service";
import { Request, Response, NextFunction } from 'express';



class PostController {
	//[create post]
	static async create(req: Request, res: Response, next: NextFunction) {
		try {
			const userId=(req as any).userId;
			const imageFiles = req.files as Express.Multer.File[];
			const imageUrls = imageFiles.map((file) => file.path);
			const newPost = await PostService.createPost(req.body, imageUrls,userId);
			return res.status(201).json(
				ApiResponse.success(newPost, "Tạo bài đăng thành công!")
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
	
	//[getPost]
	static async getPost(req: Request, res: Response, next: NextFunction) {
    try {
			const {slug}=req.params;
			const post=await PostService.getPost(slug);
      return res.status(200).json(
        ApiResponse.success(post, "thành công")
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

						//test1
						//test2
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
	//[verify post]
	static async verifyPost(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json( ApiResponse.success( {},"thành công") );
    } catch (error) {
      next(error);
    }
  }
}


export default PostController;