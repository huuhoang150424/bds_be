'use-strict';

import {ApiResponse} from "@helper";
import {PostService} from "@service";
import { Request, Response, NextFunction } from 'express';




class PostController {
	//[create post]
	static async create(req: Request, res: Response, next: NextFunction) {
		try {
			const userId=(req as any).user.userId;
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
	//[getAllPost]
  static async getAllPost(req: Request, res: Response, next: NextFunction) {
    try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;  
			const posts=await PostService.getPosts(page,limit);
      return res.status(200).json( ApiResponse.success(posts, "thành công" ));
    } catch (error) {
      next(error);
    }
  }
	
	//[getAllPost for client]
  static async getAllPostForClient(req: Request, res: Response, next: NextFunction) {
    try {
			const page=parseInt(req.query.page as string) || 1;
			const limit=parseInt(req.query.limit as string) || 10;
			const posts=await PostService.getPostsForClient(page,limit);
      return res.status(200).json(ApiResponse.success(posts, "thành công" ) );
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

	//[verify post]
	static async approvePost(req: Request, res: Response, next: NextFunction) {
    try {
			const {postId}=req.params;
			const post=await PostService.approvePost(postId);
      return res.status(200).json( ApiResponse.success( post,"Duyệt bài thành công") );
    } catch (error) {
      next(error);
    }
  }

	//[search post]
	static async searchPost(req: Request, res: Response, next: NextFunction) {
		try {
			const { keyword, addresses, page = 1, limit = 10 } = req.query;
			let addressList: string[] = [];
			if (typeof addresses === 'string') {
				addressList = [addresses]; 
			} else if (Array.isArray(addresses)) {
				addressList = addresses.map((addr) => String(addr)); 
			}
			const result = await PostService.searchPosts(
				keyword as string,
				addressList,
				Number(page),
				Number(limit)
			);
			return res.status(200).json(ApiResponse.success(result, 'Thành công'));
		} catch (error) {
			next(error);
		}
	}
	
	//[filter post]
	static async filterPost(req: Request, res: Response, next: NextFunction) {
		try {

			return res.status(200).json( ApiResponse.success( {},"thành công") );
		} catch (error) {
			next(error);
		}
	}
	//[update Post]
	static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
			const userId=(req as any).user.userId;
			const postId=req.params.postId;
			const updateData = req.body;
			const imageFiles = req.files as Express.Multer.File[];
			const imageUrls = imageFiles.map((file) => file.path);
			const newPost=await PostService.updatePost(postId, userId,updateData,imageUrls);
      return res.status(200).json(ApiResponse.success( newPost, "Cập nhật bài đăng thành công"));
    } catch (error) {
      next(error);
    }
  }
	//[delete Post]
	static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
			const userId=(req as any).user.userId;
			const postId=req.params.postId;
			await PostService.deletePost(postId, userId);
			return res.status(200).json( ApiResponse.success(null, "Xóa bài đăng thành công"));
    } catch (error) {
      next(error);
    }
  }
}


export default PostController;