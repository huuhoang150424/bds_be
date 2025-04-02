import jwt from 'jsonwebtoken';
import TokenError from './error/token-error';
import "dotenv/config";

const generaAccessToken = async (user: any) => {
  const tokenKey = process.env.ACCESS_TOKEN_KEY;
  if (!tokenKey) {
    throw new TokenError('Lỗi: Không tìm thấy ACCESS_TOKEN_KEY');
  }
  return jwt.sign(
    {
      userId: user.id,
      role: user.roles,
    },
    tokenKey,
    { expiresIn: "1h" }
  );
};

const generaRefreshToken = async (user: any) => {
  const tokenKey = process.env.REFRESH_TOKEN_KEY;
  if (!tokenKey) {
    throw new TokenError('Lỗi: Không tìm thấy REFRESH_TOKEN_KEY');
  }
  return jwt.sign(
    {
      userId: user.id,
			role: user.roles,
    },
    tokenKey,
    { expiresIn:"365d"},
  );
};

export {
  generaAccessToken,
  generaRefreshToken
};
