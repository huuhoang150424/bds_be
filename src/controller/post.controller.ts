'use-strict';

import { ApiResponse, BadRequestError } from '@helper';
import { PostDraftService, PostService } from '@service';
import { Request, Response, NextFunction } from 'express';

class PostController {
  //[create post]
  static async create(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const imageFiles = req.files as Express.Multer.File[];
    const imageUrls = imageFiles.map((file) => file.path);
    try {
      const newPost = await PostService.createPost(req.body, imageUrls, userId);
      return res.status(201).json(ApiResponse.success(newPost, 'Tạo bài đăng thành công!'));
    } catch (error) {
      next(error);
    }
  }
  //[getAllPost]
  static async getAllPost(req: Request, res: Response, next: NextFunction) {
    const { page, limit, offset } = (req as any).pagination;
    try {
      const posts = await PostService.getPosts(page, limit, offset);
      return res.status(200).json(ApiResponse.success(posts, 'thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[getAllPost for client]
  static async getAllPostForClient(req: Request, res: Response, next: NextFunction) {
    const { page, limit } = (req as any).pagination;
    try {
      const posts = await PostService.getPostsForClient(page, limit);
      return res.status(200).json(ApiResponse.success(posts, 'thành công'));
    } catch (error) {
      next(error);
    }
  }
  //[getPost]
  static async getPost(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params;
    const userId = (req as any)?.user?.userId;
    console.log('check ', userId);
    try {
      const post = await PostService.getPost(slug, userId);
      return res.status(200).json(ApiResponse.success(post, 'thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[verify post]
  static async bulkApprovePosts(req: Request, res: Response, next: NextFunction) {
    const { postIds }: { postIds: string[] } = req.body;
    try {
      const posts = await PostService.approvePosts(postIds);
      return res.status(200).json(ApiResponse.success(posts, `Duyệt ${postIds.length} bài đăng thành công`));
    } catch (error) {
      next(error);
    }
  }

  //
  static async bulkRejectPosts(req: Request, res: Response, next: NextFunction) {
    const { postIds, reason } = req.body;
    try {
      await PostService.rejectPosts(postIds, reason);
      return res.status(200).json(ApiResponse.success(null, `Từ chối bài đăng thành công`));
    } catch (error) {
      next(error);
    }
  }

  //[search post]
  static async searchPost(req: Request, res: Response, next: NextFunction) {
    const { addresses } = req.query;
    const { page, limit, offset } = (req as any).pagination;
    let addressList: string[] = [];
    if (typeof addresses === 'string') {
      addressList = [addresses];
    } else if (Array.isArray(addresses)) {
      addressList = addresses.map((addr) => String(addr));
    }
    try {
      const result = await PostService.searchPosts(addressList, page, limit, offset);
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
      return res.status(200).json(ApiResponse.success(result, 'thành công'));
    } catch (error) {
      next(error);
    }
  }
  //[update Post]
  static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as any).user;
      const { postId } = req.params;
      const imageFiles = req.files as Express.Multer.File[];
      const { deletedImageUrls, ...updateData } = req.body;
      const urlsToDelete = deletedImageUrls
        ? Array.isArray(deletedImageUrls)
          ? deletedImageUrls
          : JSON.parse(deletedImageUrls)
        : [];

      const newImageUrls = imageFiles ? imageFiles.map((file) => file.path) : [];
      const updatedPost = await PostService.updatePost(postId, userId, updateData, urlsToDelete, newImageUrls);

      return res.status(200).json(ApiResponse.success(updatedPost, 'Cập nhật bài đăng thành công'));
    } catch (error) {
      next(error);
    }
  }
  //[delete Post]
  static async deletePost(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { postId } = req.params;
    try {
      await PostService.deletePost(postId, userId);
      return res.status(200).json(ApiResponse.success(null, 'Xóa bài đăng thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async deletePosts(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;

    const { postIds, reason }: { postIds: string[]; reason: string } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json(ApiResponse.error('Lý do xóa là bắt buộc'));
    }

    try {
      const result = await PostService.deletePosts(postIds, userId, reason);
      return res.status(200).json(ApiResponse.success(null, result.message));
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

  static async getListingTypes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const listingTypes = await PostService.getListingTypes();
      return res.status(200).json(ApiResponse.success(listingTypes, 'Danh sách loại tin đăng'));
    } catch (error) {
      next(error);
    }
  }

  static async getAllPostByUser(req: Request, res: Response, next: NextFunction) {
    const { type } = req.params;
    const { page, limit, offset } = (req as any).pagination;
    const { userId } = (req as any).user;
    try {
      const isRegularPost = type === 'Post';
      const posts = isRegularPost
        ? await PostService.getPostByUser(page, limit, offset, userId)
        : await PostDraftService.getAllPostDraft(userId, page, limit, offset);
      return res.status(200).json(ApiResponse.success(posts, 'thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async getAllPostTarget(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;
    try {
      const posts = await PostService.getPostTarget(userId);
      return res.status(200).json(ApiResponse.success(posts, 'thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async createListingType(req: Request, res: Response, next: NextFunction) {
    const { listingType } = req.body;
    try {
      const newListingType = await PostService.createListingType(listingType);
      return res.status(201).json(ApiResponse.success(newListingType, 'Tạo mới danh mục thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteListingType(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await PostService.deleteListingType(id);
      return res.status(200).json(ApiResponse.success(null, 'Xóa danh mục thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async updateListingType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { listingType } = req.body;
      const updatedListingType = await PostService.updateListingType(id, listingType);
      return res.status(200).json(ApiResponse.success(updatedListingType, 'Cập nhật danh mục thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async bulkAiApprovePosts(req: Request, res: Response, next: NextFunction) {
    try {
      const postIds = await PostService.enqueuePostsForAiApproval();
      const results = await PostService.processAiApprovalQueue();

      const approvedCount = results.filter((r) => r.approved).length;
      const rejectedCount = results.length - approvedCount;
      const approvalRate = results.length > 0 ? ((approvedCount / results.length) * 100).toFixed(2) : 0;

      return res.status(200).json(
        ApiResponse.success(
          {
            totalCount: results.length,
            approvedCount,
            rejectedCount,
            approvalRate: `${approvalRate}%`,
            details: results,
          },
          `Duyệt ${postIds.length} bài đăng bằng AI thành công`
        )
      );
    } catch (error) {
      next(error);
    }
  }


	static async getPostCountByLocation(req: Request, res: Response, next: NextFunction) {
    const { province } = req.query;
		try {
      const postCounts = await PostService.getPostCountByLocation(province as string);
      return res.status(200).json(ApiResponse.success(postCounts, 'Thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async getPostsByMapBounds(req: Request, res: Response, next: NextFunction) {
    const { page, limit, offset } = (req as any).pagination;
    const {  address } = req.params;
    try {
      const posts = await PostService.getPostsByMapBounds(page, limit, offset, address);
      return res.status(200).json(ApiResponse.success(posts, 'Thành công'));
    } catch (error) {
      next(error);
    }
  }


  static async getTopPostsByMonth(req: Request, res: Response, next: NextFunction) {
    const { year, month } = req.query;
    try {
      const parsedYear = parseInt(year as string, 10);
      const parsedMonth = parseInt(month as string, 10);
      if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        throw new BadRequestError('Year hoặc month không hợp lệ');
      }
      const posts = await PostService.getTopPostsByMonth(parsedYear, parsedMonth);
      return res.status(200).json(ApiResponse.success(posts, 'Lấy danh sách bài đăng nổi bật thành công'));
    } catch (error) {
      next(error);
    }
  }
	
}

export default PostController;
