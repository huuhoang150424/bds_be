
import { v4 as uuidv4 } from 'uuid';
import { PostDraft,User, Tag, TagPost, Image, ListingType, PropertyType } from '@models';
import { NotFoundError,BadRequestError } from '@helper';

class PostDraftService {
  static async createPostDraft(userId: string, data: any, imageUrls: string[]) {
    const listingType = await ListingType.findOne({
      where: { id: data.listingType },
    });
    if (!listingType) {
      throw new BadRequestError('Loại tin đăng không hợp lệ');
    }
    const existsPost = await PostDraft.findOne({
      where: { title: data.title },
    });
    if (existsPost) {
      throw new BadRequestError('Bản nháp đã tồn tại');
    }
    const priceUnit = listingType.listingType === 'Bán' ? 'VND' : 'VND/tháng';
    const newPostDraft = await PostDraft.create({
      userId: userId,
      id: uuidv4(),
      title: data.title,
      address: data.address,
      squareMeters: data.squareMeters,
      description: data.description,
      floor: data.floor,
      bedroom: data.bedroom,
      bathroom: data.bathroom,
      isFurniture: data.isFurniture,
      direction: data.direction,
      priceUnit: priceUnit,
      price: data.price,
    });
    await PropertyType.create({
      id: uuidv4(),
      name: data.propertyType,
      postDraftId: newPostDraft.id,
      listingTypeId: data.listingType,
    })
    await Promise.all(
      imageUrls.map(async (image) => {
        await Image.create({
          id: uuidv4(),
          imageUrl: image,
          postDraftId: newPostDraft.id,
        });
      }),
    );
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      await Promise.all(
        data.tags.map(async (tagName: string) => {
          const [tag] = await Tag.findOrCreate({
            where: { tagName },
            defaults: { id: uuidv4(), tagName },
          });
          await TagPost.create({
            tagId: tag.id,
            postDraftId: newPostDraft.id,
          });
        }),
      );
    }
    return newPostDraft;
  }

  static async updatePostDraft() {

    
  }
  static async getPostDraft() {}
  static async getAllPostDraft() {}
  static async deletePostDraft() {}
  static async publishPostDraft() {}
}


export default PostDraftService;