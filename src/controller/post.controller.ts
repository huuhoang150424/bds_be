'use-strict';

import { ApiResponse } from "@helper";
import { PostService } from "@service";
import { Request, Response, NextFunction } from 'express';




class PostController {
	//[create post]
	static async create(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
		const imageFiles = req.files as Express.Multer.File[];
		const imageUrls = imageFiles.map((file) => file.path);
		try {
			const newPost = await PostService.createPost(req.body, imageUrls, userId);
			return res.status(201).json(
				ApiResponse.success(newPost, "Tạo bài đăng thành công!")
			);
		} catch (error) {
			next(error);
		}
	}
	//[getAllPost]
	static async getAllPost(req: Request, res: Response, next: NextFunction) {
		const { page, limit, offset } = (req as any).pagination;
		try {
			const posts = await PostService.getPosts(page, limit, offset);
			return res.status(200).json(ApiResponse.success(posts, "thành công"));
		} catch (error) {
			next(error);
		}
	}
	

	//[getAllPost for client]
	static async getAllPostForClient(req: Request, res: Response, next: NextFunction) {
		const { page, limit } = (req as any).pagination;
		try {
			const posts = await PostService.getPostsForClient(page, limit);
			return res.status(200).json(ApiResponse.success(posts, "thành công"));
		} catch (error) {
			next(error);
		}
	}
	//[getPost]
	static async getPost(req: Request, res: Response, next: NextFunction) {
		const { slug } = req.params;
		const userId = (req as any)?.user?.userId;
	
		try {
			const post = await PostService.getPost(slug, userId); 
			return res.status(200).json(ApiResponse.success(post, "thành công"));
		} catch (error) {
			next(error);
		}
	}
	

	//[verify post]
	static async approvePost(req: Request, res: Response, next: NextFunction) {
		const { postId } = req.params;
		try {
			const post = await PostService.approvePost(postId);
			return res.status(200).json(ApiResponse.success(post, "Duyệt bài thành công"));
		} catch (error) {
			next(error);
		}
	}

	//[search post]
	static async searchPost(req: Request, res: Response, next: NextFunction) {
		const {  addresses } = req.query;
		const { page, limit,offset } = (req as any).pagination;
		let addressList: string[] = [];
		if (typeof addresses === 'string') {
			addressList = [addresses];
		} else if (Array.isArray(addresses)) {
			addressList = addresses.map((addr) => String(addr));
		}
		try {
			const result = await PostService.searchPosts(	addressList,page,limit,offset
			);
			return res.status(200).json(ApiResponse.success(result, 'Thành công'));
		} catch (error) {
			next(error);
		}
	}

	//[filter post]
	static async filterPost(req: Request, res: Response, next: NextFunction) {
		try {
			const { page, limit, offset } = (req as any).pagination;
			const result = await PostService.filterPosts(req.query, page, limit, offset);
			return res.status(200).json(ApiResponse.success(result, "thành công"));
		} catch (error) {
			next(error);
		}
	}
	//[update Post]
	static async updatePost(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
		const {postId} = req.params;
		const updateData = req.body;
		const imageFiles = req.files as Express.Multer.File[];
		const imageUrls = imageFiles.map((file) => file.path);
		try {
			const newPost = await PostService.updatePost(postId, userId, updateData, imageUrls);
			return res.status(200).json(ApiResponse.success(newPost, "Cập nhật bài đăng thành công"));
		} catch (error) {
			next(error);
		}
	}
	//[delete Post]
	static async deletePost(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
		const {postId} = req.params;
		try {
			await PostService.deletePost(postId, userId);
			return res.status(200).json(ApiResponse.success(null, "Xóa bài đăng thành công"));
		} catch (error) {
			next(error);
		}
	}


	//[get post outstanding]
	static async getPostOutstanding(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await PostService.getPostOutstanding();
      return res.status(200).json(ApiResponse.success(posts, 'Lấy bài viết nổi bật thành công'));
    } catch (error) {
      next(error);
    }
  }

	static async getPostHabit(req: Request, res: Response, next: NextFunction) {
		const { userId } = (req as any).user;
    try {
      const posts = await PostService.getPostHabit(userId);
      return res.status(200).json(ApiResponse.success(posts, 'Lấy bài viết nổi bật thành công'));
    } catch (error) {
      next(error);
    }
  }
}


export default PostController;