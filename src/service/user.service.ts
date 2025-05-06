import { Comment, Post, Rating, Transaction, User, Wishlist } from '@models';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@helper';
import { Roles } from '@models/enums';
import { sequelize } from '@config/database';
import { col, fn, literal, Op, type WhereOptions } from 'sequelize';

class UserService {
  static async getAllUser(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    return { rows, count };
  }

  static async getUserById(userId: string) {
    const findUser = await User.findByPk(userId);
    if (!findUser) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    return findUser;
  }
  static async getUserProfile(userId: string) {
    const findUser = await User.findOne({
      where: { id: userId },
      attributes: [
        'id',
        'fullname',
        'email',
        'avatar',
        'phone',
        'isProfessional',
        'active',
        'address',
        'coverPhoto',
        'selfIntroduction',
        'certificates',
        'experienceYears',
        'expertise',
        'gender',
        'dateOfBirth',
        'emailVerified',
        'roles',
        'balance',
        'score',
        'lastActive',
        'isLock',
      ],
    });

    if (!findUser) {
      console.log('check 1');
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    const userPosts = await Post.findAll({
      where: { userId },
      attributes: ['id'],
    });
    const postIds = userPosts.map((post) => post.id);
    const postsCount = postIds.length;
    let averageRating = '0.0';
    let totalRatings = 0;
    if (postIds.length > 0) {
      const ratingSummary = await Rating.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings'],
        ],
        where: {
          postId: { [Op.in]: postIds },
        },
      });
      averageRating = parseFloat(ratingSummary?.getDataValue('averageRating') || '0').toFixed(1);
      totalRatings = parseInt(ratingSummary?.getDataValue('totalRatings') || '0');
    }
    const transactionsCount = await Transaction.count({
      where: { userId },
    });
    const result = findUser.toJSON();
    result.averageRating = averageRating;
    result.totalRatings = totalRatings;
    result.stats = {
      posts: postsCount,
      ratings: parseFloat(averageRating),
      transactions: transactionsCount,
    };

    if (result.expertise && typeof result.expertise === 'string') {
      result.expertise = result.expertise.split(',').map((item: string) => item.trim());
    }

    if (result.certificates && Array.isArray(result.certificates)) {
      result.certificates = result.certificates.join(', ');
    }

    return result;
  }

  static async updateUser(
    userId: string,
    data: any,
    files: any,
    user: any,
    removedAvatarUrl?: string,
    removedCoverPhotoUrl?: string,
    removedCertificateUrl?: string,
  ) {
    if (user.userId !== userId) {
      throw new UnauthorizedError('Bạn không có quyền cập nhật thông tin người dùng này');
    }
    const findUser = await User.findOne({ where: { id: userId } });
    if (!findUser) {
      throw new BadRequestError('Không tìm thấy người dùng');
    }
    if (
      Object.keys(data).length === 0 &&
      (!files || (!files.avatar && !files.coverPhoto && !files.certificates)) &&
      !removedAvatarUrl &&
      !removedCoverPhotoUrl &&
      !removedCertificateUrl
    ) {
      throw new BadRequestError('Không có dữ liệu nào để cập nhật');
    }
    const basicFields = ['fullname', 'email', 'phone', 'address', 'gender', 'dateOfBirth', 'password'];
    const agentFields = ['selfIntroduction', 'experienceYears', 'certificates', 'expertise'];
    const updateData: any = { ...data };
    const isAgent = findUser.roles === Roles.Agent || data.roles === Roles.Agent;
    basicFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    if (isAgent) {
      agentFields.forEach((field) => {
        if (data[field] !== undefined) {
          if (field === 'expertise') {
            try {
              updateData[field] = JSON.parse(data[field]);
            } catch {
              updateData[field] = data[field];
            }
          } else {
            updateData[field] = data[field];
          }
        }
      });
    }
    if (files?.avatar?.[0]) {
      updateData.avatar = files.avatar[0].path;
    } else if (removedAvatarUrl && removedAvatarUrl === findUser.avatar) {
      updateData.avatar = User.getAttributes().avatar.defaultValue;
    }
    if (files?.coverPhoto?.[0]) {
      updateData.coverPhoto = files.coverPhoto[0].path;
    } else if (removedCoverPhotoUrl && removedCoverPhotoUrl === findUser.coverPhoto) {
      updateData.coverPhoto = User.getAttributes().coverPhoto.defaultValue;
    }
    if (files?.certificates?.[0]) {
      updateData.certificates = files.certificates[0].path;
    } else if (removedCertificateUrl && removedCertificateUrl === findUser.certificates) {
      updateData.certificates = User.getAttributes().certificates.defaultValue;
    }
    await findUser.update(updateData);
    const updatedUser = await User.findOne({ where: { id: userId } });
    return updatedUser;
  }
  static async toggleLockUser(userId: string, type: string) {
    const findUser = await this.getUserById(userId);
    if (type === 'UNLOCK' && !findUser.isLock) {
      throw new BadRequestError('Người dùng này chưa bị khóa');
    }
    if (type === 'LOCK' && findUser.isLock) {
      throw new BadRequestError('Người dùng này đã bị khóa');
    }
    findUser.isLock = type === 'UNLOCK' ? false : true;
    await findUser.save();
    return findUser;
  }

  static async updatePhone(userId: string, phone: string) {
    const findUser = await this.getUserById(userId);

    const phoneStr = phone.toString();

    if (!/^\d{10}$/.test(phoneStr)) {
      console.log('check 3');
      throw new BadRequestError('Số điện thoại phải 10 số');
    }
    findUser.phone = phone;
    await findUser.save();
    return { newPhone: phone };
  }

  static async registerAsBroker(userId: string, data: any) {
    const findUser = await this.getUserById(userId);
    if (!findUser.emailVerified) {
      console.log('check 4');
      throw new BadRequestError('Bạn phải xác thực email trước');
    }

    if (findUser.roles === Roles.Agent) {
      console.log('check 5');
      throw new BadRequestError('Người dùng đã là môi giới bất động sản');
    }
    findUser.roles = Roles.Agent;
    findUser.address = data.address;
    findUser.selfIntroduction = data.selfIntroduction;
    findUser.experienceYears = data.experienceYears;
    if (data.certificates) {
      findUser.certificates = data.certificates;
    }
    if (data.fullname) {
      findUser.fullname = data.fullname;
    }
    if (data.phone) {
      findUser.phone = data.phone;
    }
    findUser.expertise = data.expertise || [];
    await findUser.save();
    return {
      roles: findUser.roles,
    };
  }

  private static async findProfessionalAgents(where: any, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const agents = await User.findAndCountAll({
      attributes: [
        'id',
        'fullname',
        'email',
        'phone',
        'address',
        'self_introduction',
        'experience_years',
        'certificates',
        'expertise',
        'avatar',
        [literal(`(SELECT COUNT(DISTINCT posts.id) FROM posts WHERE posts.user_id = User.id)`), 'postCount'],
        [
          literal(`(
                    SELECT COALESCE(SUM(
                        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id)
                    ), 0)
                    FROM posts WHERE posts.user_id = User.id
                )`),
          'commentCount',
        ],
        [
          literal(`(
                    SELECT COALESCE(SUM(
                        (SELECT COUNT(*) FROM wishlists WHERE post_id = posts.id)
                    ), 0)
                    FROM posts WHERE posts.user_id = User.id
                )`),
          'wishlistCount',
        ],
        [
          literal(`(
                    SELECT COALESCE(SUM(
                        (SELECT COUNT(*) FROM ratings WHERE post_id = posts.id)
                    ), 0)
                    FROM posts WHERE posts.user_id = User.id
                )`),
          'ratingCount',
        ],
        [
          literal(`(
                    SELECT COALESCE(SUM(
                        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) * 0.5 +
                        (SELECT COUNT(*) FROM wishlists WHERE post_id = posts.id) * 0.3 +
                        (SELECT COUNT(*) FROM ratings WHERE post_id = posts.id) * 1.5
                    ), 0)
                    FROM posts WHERE posts.user_id = User.id
                )`),
          'totalScore',
        ],
      ],
      where,
      order: [[literal('totalScore'), 'DESC']],
      limit: limit,
      offset: offset,
      subQuery: false,
    });

    return {
      currentPage: page,
      totalItems: agents.count,
      totalPages: Math.ceil(agents.count / limit),
      data: agents.rows,
    };
  }
  static async getProfessionalAgents(page: number, limit: number) {
    const where: any = {
      isProfessional: true,
      isLock: false,
      roles: Roles.Agent,
    };

    return this.findProfessionalAgents(where, page, limit);
  }
  static async searchProfessionalAgents(page: number, limit: number, keyword?: string) {
    const searchQuery = keyword ? `%${keyword}%` : '%';
    const where: WhereOptions = {
      is_professional: true,
      is_lock: false,
      roles: Roles.Agent,
      [Op.or]: [
        { fullname: { [Op.like]: fn('LOWER', searchQuery) } },
        { email: { [Op.like]: fn('LOWER', searchQuery) } },
        { phone: { [Op.like]: fn('LOWER', searchQuery) } },
        { address: { [Op.like]: fn('LOWER', searchQuery) } },
      ],
    };

    return this.findProfessionalAgents(where, page, limit);
  }
}

export default UserService;
