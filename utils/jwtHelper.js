// utils/jwtHelper.js
const jwt = require('jsonwebtoken');

// Helper function to determine user type
const getUserType = user => {
  if (user.is_admin) return 'admin';
  if (user.is_practitioner) return 'practitioner';
  return 'user';
};

const generateAccessToken = (user, duration) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: getUserType(user)
    }, // Payload (user info to embed in the token)
    process.env.JWT_SECRET, // Secret key
    { expiresIn: duration } // Token expiry (15 minutes)
  );
};

const generateResetPasswordToken = user => {
  try {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: getUserType(user)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expiry (2 hr)
    );
  } catch (err) {
    console.log('err', err);
  }
};

const verifyAccessToken = token => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Validate token
    return decoded; // Return the decoded token if valid
  } catch (err) {
    console.log('err', err);
  }
};

const verifyRefreshToken = refreshToken => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET); // Verify refresh token
    return decoded; // Return the decoded user data
  } catch (err) {
    console.log('err', err);
  }
};

const revokedTokens = []; // You can replace this with a DB or Redis

const isTokenRevoked = token => {
  return revokedTokens.includes(token); // Check if token is in the blacklist
};

const revokeToken = token => {
  revokedTokens.push(token); // Add token to the blacklist
};

const generateRefreshToken = user => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: getUserType(user)
    }, // Payload
    process.env.JWT_SECRET, // Separate secret for refresh tokens
    { expiresIn: '2h' } // Token expiry (7 days)
  );
};

module.exports.generateAccessToken = generateAccessToken;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.isTokenRevoked = isTokenRevoked;
module.exports.revokeToken = revokeToken;
module.exports.generateResetPasswordToken = generateResetPasswordToken;
module.exports.getUserType = getUserType;
