const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const { generateAccessToken, getUserType } = require('../utils/jwtHelper');

const verifyToken = async (ctx, next) => {
  const refreshToken = ctx.request.headers['authorization'];

  if (!refreshToken) {
    ctx.status = 500;
    ctx.body = {
      message: 'A token is required for authentication',
      status: true,
      data: null
    };

    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (!decoded || !decoded.exp) {
      ctx.status = 500;
      ctx.body = {
        message: 'A token is required for authentication',
        status: true,
        data: null
      };

      return;
    }

    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user || !user.access_token) {
      ctx.status = 401;
      ctx.body = {
        message: 'Invalid Token',
        status: true,
        data: null
      };

      return;
    }

    const isRefreshTokenExpired = decoded.exp * 1000 < Date.now();

    if (isRefreshTokenExpired) {
      const userInfo = jwt.verify(user.access_token, process.env.JWT_SECRET);

      const isAccessTokenExpired = userInfo.exp * 1000 < Date.now();

      if (isAccessTokenExpired) {
        await User.update({ access_token: null }, { where: { id: user.id } });

        ctx.status = 401;
        ctx.body = {
          message: 'Invalid Token',
          status: true,
          data: null
        };

        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = userInfo.exp - currentTime;

      if (timeRemaining <= 300 && timeRemaining > 0) {
        const duration = user.remember_me ? '30d' : '2h';
        const accessToken = generateAccessToken(user, duration);

        await User.update({ access_token: accessToken }, { where: { id: user.id } });
      }

      ctx.customData = {
        id: userInfo.id,
        email: userInfo.email,
        user_type: userInfo.user_type || getUserType(user)
      };
    } else {
      ctx.customData = {
        id: decoded.id,
        email: decoded.email,
        user_type: decoded.user_type || getUserType(user)
      };
    }
  } catch (err) {
    ctx.status = 401;
    ctx.body = {
      message: err.message,
      status: true,
      data: null
    };

    return;
  }

  return next();
};

module.exports = { verifyToken };
