import { User, Post, PostHistory, Tag, TagPost, Image, ListingType, PropertyType } from '@models';
import { NotFoundError, UnauthorizedError, TokenError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';

class PostService {
  static async createPost(data: any, images: string[],userId:string) {
    const listingType = await ListingType.findOne({
      where: { id: data.listingType },
    });
    if (!listingType) {
      throw new BadRequestError('Loại tin đăng không hợp lệ');
    }
		const existsPost=await Post.findOne({
			where: {title: data.title}
		})
		if (existsPost) {
			throw new BadRequestError('Bài đăng đã tồn tại')
		}
		const priceUnit = listingType.listingType === 'Bán' ? 'VND' : 'VND/tháng';
    const newPost = await Post.create({
			userId: userId,
      id: uuidv4(),
      title: data.title,
      address: data.address,
      square_meters: data.square_meters,
      description: data.description,
      floor: data.floor,
      bedroom: data.bedroom,
      bathroom: data.bathroom,
      isFurniture: data.isFurniture,
      direction: data.direction,
      expiredDate: data.expiredDate,
      expiredBoost: data.expiredBoost,
      status: data.status,
			priceUnit: priceUnit,
      price: data.price,
    });
		const propertyType = await PropertyType.findOne({
      where: { name: data.propertyType},
    });
    if (!propertyType) {
      await PropertyType.findOrCreate({
				where: {name: data.propertyType},
				defaults: {
					id: uuidv4(),
					name: data.propertyType,
					postId: newPost.id,
					listingTypeId: listingType.id
				}
			})
    }
		await Promise.all(
			images.map(async (image)=>{
				await Image.create({
					id: uuidv4(),
					imageUrl: image,
					postId: newPost.id
				})
			})
		);
		await Promise.all(
			data.tags.map(async (tag:string)=>{
				const newTag=await Tag.create({
					id: uuidv4(),
					tagName: tag
				})
				await TagPost.create({
					tagId:newTag.id,
					postId: newPost.id
				})
			})
		);
    return newPost;
  }

	static async getPost(slug:string) {
		const post =await Post.findOne({
			where: {slug},
			include: [
				{
					model: User,
					attributes: ['id','username','email','phone','avatar']
				},
				{
					model: Image,
					attributes: ['imageUrl']
				}
			]
		})
		if (!post) {
			throw new NotFoundError('Không tìm thấy bài đăng');
		}
		return post;
	}

	static async deletePost(postId:string) {
		const post=await Post.findOne({
			where:{id:postId}
		})
		if (!post) {
			throw new NotFoundError('Không tìm thấy bài đăng');
		}
		await post.destroy();
		return;
	}

	static async approvePost(postId:string) {
		const post=await Post.findOne({
			where:{id:postId}
		})
		if (!post) {
			throw new NotFoundError('Không tìm thấy bài đăng');
		}
		post.verified=true;
		await post.save();
		return post;
	}

	static async getPosts() {


	}

}

export default PostService;
