
import { v4 as uuidv4 } from 'uuid';
import { PostDraft,User, Tag, TagPost, Image, ListingType, PropertyType, Post, UserPricing, Pricing } from '@models';
import { NotFoundError,BadRequestError } from '@helper';
import { StatusPost, StatusPostDraft } from '@models/enums';

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

  static async getPostDraft(postDraftId:string) {
    const postDraft=await PostDraft.findOne({
      include: [
        {
          model: Image,
          attributes: ['image_url']
        },
        {
          model: TagPost,
          attributes: ['id'],
          include: [
            {
              model: Tag,
              attributes: ['tagName'],
            },
          ],
        },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [
            {
              model: ListingType,
              attributes: ['listing_type']
            }
          ]
        }
      ],
      where: {id: postDraftId}
    });
    if (!postDraft) {
      throw new NotFoundError('Không tìm thấy bản nháp');
    }
    return postDraft;
  }

  static async getPostDraftById(postDraftId:string) {
    const findPostDraft=await PostDraft.findOne({
      where: {id:postDraftId}
    });
    if (!findPostDraft) {
      throw new NotFoundError('Không tìm thấy bản nháp!');
    } 
    return findPostDraft;
  }

  static async getAllPostDraft(userId:string,page:number,limit: number) {
    const offset=(page-1)*limit;
    const {count,rows}=await PostDraft.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: Image,
          attributes: ['image_url']
        },
        {
          model: TagPost,
          attributes: ['id'],
          include: [
            {
              model: Tag,
              attributes: ['tagName'],
            },
          ],
        },
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
      where: {userId}
    })
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async deletePostDraft(postDraftId:string) {
    const findPostDraft=await this.getPostDraftById(postDraftId);
    await findPostDraft.destroy();
    return;
  } 

  static async updatePostDraft(postDraftId:string,data:any,imageUrls:string[]) {
    const findPostDraft=await this.getPostDraftById(postDraftId);
    const {  propertyType, ...updateData } = data;
    const listingType = await ListingType.findOne({
      where: { id: data.listingType },
    });
    if (!listingType) {
      throw new BadRequestError('Loại tin đăng không hợp lệ');
    }
    if (Array.isArray(imageUrls)) {
      const existingImage=await Image.findAll({where: {postDraftId: postDraftId}});
      const existingUrlImage=existingImage.map((image)=>image.imageUrl);
      const imageToDelete=existingImage.filter((image)=>!imageUrls.includes(image.imageUrl));
      if (imageToDelete.length>0) {
        await Image.destroy({
          where: {id : imageToDelete.map((img)=>img.id)}
        })
      }
      const newImages=imageUrls.filter((img)=>!existingUrlImage.includes(img));
      await Promise.all(
        newImages.map(async (imageUrl)=> await Image.create({id: uuidv4(),imageUrl,postDraftId}))
      )
    }
    const tags = data.tags ? (Array.isArray(data.tags) ? data.tags : [data.tags]) : [];

    if (tags.length > 0) {
      await TagPost.destroy({ where: { postDraftId } });
    
      await Promise.all(
        tags.map(async (tagName:string) => {
          const [tag] = await Tag.findOrCreate({
            where: { tagName },
            defaults: { id: uuidv4(), tagName },
          });
          await TagPost.create({ tagId: tag.id, postDraftId });
        })
      );
    }
    
    if (propertyType) {
      const [property, created] = await PropertyType.findOrCreate({
        where: { name: propertyType },
        defaults: {
          id: uuidv4(),
          name: propertyType,
          postDraftId,
          listingTypeId: listingType.id,
        },
      });
      if (!created) {
        await property.update({ postDraftId });
      }
    }
    await findPostDraft.update(updateData);
    return findPostDraft;
  }

  static async publishPostDraft(postDraftId:string) {
    const postDraft = await PostDraft.findByPk(postDraftId, {
      include: [Image, TagPost, PropertyType]
    });
    if (postDraft?.status===StatusPostDraft.PUBLISHED) {
      throw new BadRequestError('Bạn đã xuất bài viết nháp này rồi');
    }
    let userPricing = await UserPricing.findOne({
      where: { userId:postDraft?.userId },
      include: [{ model: Pricing }],
      order: [['endDate', 'DESC']],
    });
    if (!userPricing) {
      userPricing = await UserPricing.create({
        userId:postDraft?.userId,
        pricingId: null,
        remainingPosts: 15,
        displayDays: 10,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        boostDays: 0,
        hasReport: false,
        discountPercent: 0,
      });
    }
    const pricing = userPricing.pricing;
    if (!pricing || pricing.name === 'VIP_1') {
      if (userPricing.remainingPosts <= 0) {
        throw new BadRequestError(
          `Bạn đã đạt giới hạn ${userPricing.remainingPosts} bài đăng trong tháng. Hãy nâng cấp gói thành viên!`,
        );
      }
    }
    const displayDays = pricing ? pricing.displayDay : 10;
    const expiredDate = displayDays === -1 ? null : new Date(Date.now() + displayDays * 24 * 60 * 60 * 1000);
    const newPost=await Post.create({
      userId: postDraft?.userId,
      id: uuidv4(),
      title: postDraft?.title,
      address: postDraft?.address,
      squareMeters: postDraft?.squareMeters,
      description: postDraft?.description,
      floor: postDraft?.floor,
      bedroom: postDraft?.bedroom,
      bathroom: postDraft?.bathroom,
      isFurniture: postDraft?.isFurniture,
      direction: postDraft?.direction,
      status: StatusPost.Available,
      priceUnit: postDraft?.priceUnit,
      price: postDraft?.price,
      expiredDate: expiredDate,
    })
    if (postDraft?.images) {
      await Promise.all(
        postDraft.images.map(async (image) => {
          await image.update({ postId: newPost.id, postDraftId: null });
        })
      );
    }
    
    if (postDraft?.tagPosts) {
      await Promise.all(
        postDraft.tagPosts.map(async (tag) => {
          await tag.update({ postId: newPost.id }); 
        })
      );
    }
    if (postDraft?.propertyType && Array.isArray(postDraft.propertyType)) {
      await Promise.all(
        postDraft.propertyType.map(async (type) => {
          await type.update({ postId: newPost.id });
        })
      );
    }
    await postDraft?.update({ status: StatusPostDraft.PUBLISHED });
    return newPost;
  }
}


export default PostDraftService;