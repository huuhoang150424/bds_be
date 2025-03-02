'use-strict';

import {ApiResponse} from "@helper";
import {PostDraftService} from "@service";
import { Request, Response, NextFunction } from 'express';

class PostDraftController {

	//[create draft]
	static async create(req: Request, res: Response, next: NextFunction) {
		try {
			const userId=(req as any).user.userId;
			const imageFiles = req.files as Express.Multer.File[];
			const imageUrls = imageFiles.map((file) => file.path);
			const newPost = await PostDraftService.createPostDraft(userId,req.body, imageUrls);
			return res.status(201).json(
				ApiResponse.success(newPost, "Tạo bài đăng thành công!")
			);
		} catch (error) {
			next(error);
		}
	}
	//[get draft]
	static async getPostDraft(req: Request, res: Response, next: NextFunction) {
		try {
			const postDraftId=req.params.postDraftId;
			const postDraft = await PostDraftService.getPostDraft(postDraftId);
			return res.status(200).json(
				ApiResponse.success(postDraft, "Thành công!")
			);
		} catch (error) {
			next(error);
		}
	}

}


export default PostDraftController;