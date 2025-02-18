import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import TokenError from './error/token-error';

dotenv.config({ path: '.env.local' });

const generaAccessToken = async (user:any) => {
  const tokenKey=process.env.ACCESS_TOKEN_KEY;
  if (!tokenKey) {
    throw new TokenError('lỗi ',404);
  }
	console.log(user)
  return jwt.sign(
    {
      userId: user.userId,
			role: user.user_roles[0].role.roleName
    },
    tokenKey,
    { expiresIn: '1d' },
  );
};

const generaRefreshToken = async (user:any) => {
  const tokenKey=process.env.REFRESH_TOKEN_KEY;
  if (!tokenKey) {
    throw new TokenError('lỗi ',404);
  }
  return jwt.sign(
    {
      userId: user.userId
    },
    tokenKey,
    { expiresIn: '365d' },
  );
};

export {
	generaAccessToken,
	generaRefreshToken
} ;