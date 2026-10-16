const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('../models');
const User = db.User;
const {
  generateAccessToken,
  generateRefreshToken,
  generateResetPasswordToken,
  verifyAccessToken
} = require('../utils/jwtHelper');
const sendEmail = require('../utils/sendEmail');
const smsService = require('../utils/smsService');
const { Op } = require('sequelize');

// Helper function to determine user type
const getUserType = user => {
  if (user.is_admin) return 'admin';
  if (user.is_practitioner) return 'practitioner';
  return 'user';
};

// Helper function to validate user type
const isValidUserType = userType => {
  return ['admin', 'practitioner', 'user'].includes(userType);
};

// Register a new user
const register = async ctx => {
  try {
    const {
      name,
      email,
      password,
      phone,
      zipCode,
      user_type, // or userType if using camelCase
      accepted_terms,
      accepted_privacy_policy,
      accepted_waiver_agreement
    } = ctx.request.body;

    // Validate user type
    if (!isValidUserType(user_type)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid user type. Must be admin, practitioner, or user',
        status: false,
        data: null
      };
      return;
    }

    // Validate terms acceptance (only for users and practitioners, not for admin)
    if (user_type !== 'admin') {
      if (!accepted_terms) {
        ctx.status = 400;
        ctx.body = {
          message: 'You must accept the terms and conditions',
          status: false,
          data: null
        };
        return;
      }

      if (!accepted_privacy_policy) {
        ctx.status = 400;
        ctx.body = {
          message: 'You must accept the privacy policy',
          status: false,
          data: null
        };
        return;
      }

      if (!accepted_waiver_agreement) {
        ctx.status = 400;
        ctx.body = {
          message: 'You must accept the waiver agreement',
          status: false,
          data: null
        };
        return;
      }
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      let message = 'User already exists';

      if (existingUser.email === email && existingUser.phone === phone) {
        message = 'Email and phone already exist';
      } else if (existingUser.email === email) {
        message = 'Email already exists';
      } else if (existingUser.phone === phone) {
        message = 'Phone already exists';
      }

      ctx.status = 400;
      ctx.body = {
        message,
        status: false,
        data: null
      };
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification tokens - both email and phone will use 6-digit OTP
    // const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP for email
    // const phoneVerificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP for phone

    //! --- Using fixed OTPs for testing purposes ---
    const emailVerificationToken = 123456;
    const phoneVerificationToken = 123456;

    // Prepare user data based on type
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      zipCode,
      is_admin: user_type === 'admin',
      is_practitioner: user_type === 'practitioner',
      email_verified: user_type === 'admin' ? true : false, // Auto-verify admin
      phone_verified: user_type === 'admin' ? true : false, // Auto-verify admin
      email_verification_token: user_type === 'admin' ? null : emailVerificationToken,
      phone_verification_token: user_type === 'admin' ? null : phoneVerificationToken,
      accepted_terms: user_type === 'admin' ? true : accepted_terms,
      accepted_privacy_policy: user_type === 'admin' ? true : accepted_privacy_policy,
      accepted_waiver_agreement: user_type === 'admin' ? true : accepted_waiver_agreement,
      status: user_type === 'admin' || user_type === 'user' ? '1' : '0' // Auto-activate admin and practitioner
    };

    // Create the user
    const user = await User.create(userData);

    // Send verification OTPs only for non-admin users
    if (user_type !== 'admin') {
      // Send email verification OTP using SendGrid

      //! --- Using fixed OTPs for testing purposes ---
      // await sendEmail(
      //   {
      //     email: user.email,
      //     subject: 'Welcome - Sanara Wellness - Email Verification OTP',
      //     username: user.name,
      //     otp: emailVerificationToken
      //   },
      //   'welcomeEmailTemplate.html'
      // );

      // Send phone verification OTP using Twilio
      try {
        // Let the SMS service handle phone number formatting automatically

        //!---  Using fixed OTPs for testing purposes ---
        // await smsService.sendOTP(user.phone, phoneVerificationToken);
        console.log(`SMS OTP sent successfully to ${user.phone}: ${phoneVerificationToken}`);
      } catch (smsError) {
        console.error('Failed to send SMS OTP:', smsError);

        // Provide more specific error messages based on Twilio error codes
        let errorMessage = 'Failed to send SMS OTP. Please try again later.';

        if (smsError.code === 21408) {
          errorMessage = 'SMS service is not available for your region. Please contact support.';
        } else if (smsError.code === 21211) {
          errorMessage = 'Invalid phone number format. Please check your phone number.';
        } else if (smsError.code === 21608) {
          errorMessage = 'SMS service temporarily unavailable. Please try again later.';
        } else if (smsError.code === 21659) {
          errorMessage = 'SMS service configuration error. Please contact support.';
        } else if (smsError.message && smsError.message.includes('Permission')) {
          errorMessage = 'SMS service not configured for your region. Please contact support.';
        } else if (smsError.message && smsError.message.includes('not a Twilio phone number')) {
          errorMessage = 'SMS service configuration error. Please contact support.';
        }

        ctx.status = 500;
        ctx.body = {
          message: errorMessage,
          status: false,
          data: null
        };
        return;
      }
    }

    // Prepare response data
    const responseData = {
      ...user.toJSON(),
      user_type: getUserType(user)
    };

    delete responseData.password;
    delete responseData.email_verification_token;
    delete responseData.phone_verification_token;

    ctx.status = 201;
    ctx.body = {
      message:
        user_type === 'admin'
          ? `${user_type.charAt(0).toUpperCase() + user_type.slice(1)} registered successfully.`
          : `${user_type.charAt(0).toUpperCase() + user_type.slice(1)} registered successfully. Please verify your email and phone with the OTPs sent to activate your account.`,
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Registration error:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create user',
      status: false,
      data: process.env.NODE_ENV === 'development' ? err.message : null
    };
  }
};

// Login user
// Login user
const login = async ctx => {
  try {
    const { email, password, rememberMe, remember_me, user_type, is_admin = false } = ctx.request.body;

    const rememberMeValue = rememberMe || remember_me;

    const isPractitioner = user_type === 'practitioner';

    const user = await User.findOne({
      where: { email, is_practitioner: isPractitioner, is_admin: is_admin }
    });

    if (!user) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid email or password',
        status: false,
        data: null
      };
      return;
    }

    // Skip verification for admin users
    if (!user.is_admin) {
      const userData = { ...user.toJSON() };
      delete userData.password;
      delete userData.access_token;
      delete userData.reset_password_token;
      delete userData.email_verification_token;
      delete userData.phone_verification_token;

      if (!user.email_verified) {
        ctx.status = 403;
        ctx.body = {
          message: 'Please verify your email before logging in',
          status: false,
          data: userData
        };
        return;
      }

      if (!user.phone_verified) {
        ctx.status = 403;
        ctx.body = {
          message: 'Please verify your phone number before logging in',
          status: false,
          data: userData
        };
        return;
      }
    }

    // Check if account is active
    if (user.status !== '1' && !user.is_practitioner) {
      ctx.status = 403;
      ctx.body = {
        message: 'Your account is not active. Please contact support.',
        status: false,
        data: null
      };
      return;
    }

    // Check user type if specified
    if (user_type && getUserType(user) !== user_type) {
      ctx.status = 403;
      ctx.body = {
        message: `Access denied. This login is for ${user_type}s only.`,
        status: false,
        data: null
      };
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid email or password',
        status: false,
        data: null
      };
      return;
    }

    const duration = rememberMeValue ? '30d' : '2h';
    const accessToken = generateAccessToken(user, duration);

    await User.update(
      {
        access_token: accessToken,
        remember_me: rememberMeValue
      },
      { where: { id: user.id } }
    );

    // Fetch the updated user data
    const updatedUser = await User.findOne({ where: { id: user.id } });

    // Check for PractitionerModality data if user is a practitioner
    if (updatedUser.is_practitioner) {
      const modalityData = await db.PractitionerModality.findOne({
        where: { practitionerId: updatedUser.id }
      });

      const profileData = await db.PractitionerProfile.findOne({
        where: { userId: updatedUser.id }
      });

      if (!modalityData || !profileData) {
        const incompleteData = {
          ...updatedUser.toJSON(),
          token: generateRefreshToken(updatedUser),
          user_type: getUserType(updatedUser),
          profile_incomplete: true
        };

        delete incompleteData.access_token;
        delete incompleteData.password;
        delete incompleteData.reset_password_token;
        delete incompleteData.email_verification_token;
        delete incompleteData.phone_verification_token;

        ctx.status = 200;
        ctx.body = {
          message: 'Login successful, but practitioner profile is incomplete',
          status: true,
          data: incompleteData
        };
        return;
      }
    }

    const refreshToken = generateRefreshToken(updatedUser);

    let responseData = {
      ...updatedUser.toJSON(),
      token: refreshToken,
      user_type: getUserType(updatedUser)
    };

    delete responseData.access_token;
    delete responseData.password;
    delete responseData.reset_password_token;
    delete responseData.email_verification_token;
    delete responseData.phone_verification_token;

    ctx.status = 200;
    ctx.body = {
      message: 'Login successful',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Login error:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during login',
      status: false,
      data: null
    };
  }
};

const forgotPassword = async ctx => {
  try {
    const { email } = ctx.request.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User with that email does not exist',
        status: false,
        data: null
      };
      return;
    }

    // Generate a reset token
    const token = generateResetPasswordToken(user);

    // Update user with reset token using User.update for better PostgreSQL compatibility
    await User.update({ reset_password_token: token }, { where: { id: user.id } });

    // Send password reset email using SendGrid
    const resetLink = `${process.env.USER_APP_URL}/reset-password/${token}`;
    await sendEmail(
      {
        email: user.email,
        subject: 'Password Reset Request - Sanara Wellness',
        username: user.name,
        resetLink: resetLink
      },
      'resetPasswordTemplate.html'
    );

    ctx.status = 200;
    ctx.body = {
      message: 'Password reset link sent to your email',
      status: true,
      data: null
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during password reset',
      status: false,
      data: null
    };
  }
};

const resendForgotPasswordEmail = async ctx => {
  try {
    const { email } = ctx.request.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User with that email does not exist',
        status: false,
        data: null
      };
      return;
    }

    // Generate a reset token
    const token = generateResetPasswordToken(user);

    // Update user with reset token using User.update for better PostgreSQL compatibility
    await User.update({ reset_password_token: token }, { where: { id: user.id } });

    // Send password reset email using SendGrid
    const resetLink = `${process.env.USER_APP_URL}/reset-password/${token}`;
    await sendEmail(
      {
        email: user.email,
        subject: 'Password Reset Request - Sanara Wellness',
        username: user.name,
        resetLink: resetLink
      },
      'resetPasswordTemplate.html'
    );

    ctx.status = 200;
    ctx.body = {
      message: 'Password reset link sent to your email',
      status: true,
      data: null
    };
  } catch (error) {
    console.error('Resend forgot password error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during password reset',
      status: false,
      data: null
    };
  }
};

// Verify Token Password
const verifyResetToken = async ctx => {
  const { token } = ctx.request.body;

  // Find user by token and check expiration
  const user = await User.findOne({
    where: {
      reset_password_token: token
    }
  });

  if (!user) {
    ctx.status = 400;
    ctx.body = {
      message: 'Password reset token is invalid or has expired',
      status: false,
      data: null
    };
    return;
  }

  const tokenValues = verifyAccessToken(token);

  const isRefreshTokenExpired = tokenValues.exp * 1000 < Date.now();

  if (isRefreshTokenExpired) {
    ctx.status = 400;
    ctx.body = {
      message: 'Password reset token is invalid or has expired',
      status: false,
      data: null
    };
    return;
  }

  ctx.status = 200;
  ctx.body = {
    message: 'Password reset token verified successfully',
    status: true,
    data: { email: user.email }
  };
};

// Reset Password
const resetPassword = async ctx => {
  try {
    const { email, password } = ctx.request.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      ctx.status = 400;
      ctx.body = {
        message: 'Password reset token is invalid or has expired',
        status: false,
        data: null
      };
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password and clear reset token using User.update
    await User.update(
      {
        password: hashedPassword,
        reset_password_token: null
      },
      { where: { id: user.id } }
    );

    ctx.status = 200;
    ctx.body = {
      message: 'Password has been reset successfully',
      status: true,
      data: null
    };
  } catch (error) {
    console.error('Reset password error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during password reset',
      status: false,
      data: null
    };
  }
};

const verifyUserAuth = async ctx => {
  const { id } = ctx.customData;

  const user = await User.findOne({ where: { id } });

  if (!user) {
    ctx.status = 400;
    ctx.body = {
      message: 'Invalid email or password',
      status: false,
      data: null
    };
    return;
  }

  const refreshToken = generateRefreshToken(user);

  let responseData = {
    ...user.toJSON(),
    token: refreshToken,
    user_type: getUserType(user)
  };

  delete responseData.access_token;
  delete responseData.password;
  delete responseData.reset_password_token;

  // Respond with success message
  ctx.status = 200;
  ctx.body = {
    message: 'user verified',
    status: true,
    data: responseData
  };
};

const logout = async ctx => {
  const { id } = ctx.customData;

  await User.update({ access_token: null }, { where: { id: id } });

  // Respond with success message
  ctx.status = 200;
  ctx.body = {
    message: 'User logged out successfully',
    status: true,
    data: null
  };
};

// Change password for logged-in user
const changePassword = async ctx => {
  try {
    const { id: userId } = ctx.customData; // Current user ID from token
    const { currentPassword, newPassword, confirmPassword } = ctx.request.body;

    // Validate required fields
    if (!currentPassword) {
      ctx.status = 400;
      ctx.body = {
        message: 'Current password is required',
        status: false,
        data: null
      };
      return;
    }

    if (!newPassword) {
      ctx.status = 400;
      ctx.body = {
        message: 'New password is required',
        status: false,
        data: null
      };
      return;
    }

    if (!confirmPassword) {
      ctx.status = 400;
      ctx.body = {
        message: 'Confirm password is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      ctx.status = 400;
      ctx.body = {
        message: 'New password must be at least 6 characters long',
        status: false,
        data: null
      };
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      ctx.status = 400;
      ctx.body = {
        message: 'New password and confirm password do not match',
        status: false,
        data: null
      };
      return;
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      ctx.status = 400;
      ctx.body = {
        message: 'Current password is incorrect',
        status: false,
        data: null
      };
      return;
    }

    // Check if new password is same as current password
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
      ctx.status = 400;
      ctx.body = {
        message: 'New password must be different from current password',
        status: false,
        data: null
      };
      return;
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    await user.update({
      password: hashedNewPassword
    });

    // Fetch updated user data
    const updatedUser = await User.findByPk(userId);

    // Prepare response data
    const responseData = {
      ...updatedUser.toJSON(),
      user_type: getUserType(updatedUser)
    };

    // Remove sensitive data from response
    delete responseData.password;
    delete responseData.access_token;
    delete responseData.reset_password_token;

    ctx.status = 200;
    ctx.body = {
      message: 'Password changed successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in changePassword:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to change password',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Verify email
const verifyEmail = async ctx => {
  try {
    const { email, otp } = ctx.request.body;

    if (!email || !otp) {
      ctx.status = 400;
      ctx.body = {
        message: 'Email and OTP are required',
        status: false,
        data: null
      };
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if already verified
    if (user.email_verified) {
      ctx.status = 400;
      ctx.body = {
        message: 'Email is already verified',
        status: false,
        data: null
      };
      return;
    }

    // Verify OTP
    if (user.email_verification_token !== otp) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid OTP',
        status: false,
        data: null
      };
      return;
    }

    const duration = '2h';
    const accessToken = generateAccessToken(user, duration);

    // Update user verification status
    const updatedUser = await user.update({
      email_verified: true,
      email_verification_token: null,
      access_token: accessToken
    });

    const refreshToken = generateRefreshToken(updatedUser);

    const responseData = {
      ...user.toJSON(),
      token: refreshToken,
      user_type: getUserType(user)
    };

    delete responseData.password;
    delete responseData.email_verification_token;
    delete responseData.phone_verification_token;

    ctx.status = 200;
    ctx.body = {
      message: 'Email verified successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in verifyEmail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to verify email',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Verify phone OTP
const verifyPhone = async ctx => {
  try {
    const { phone, otp } = ctx.request.body;

    if (!phone || !otp) {
      ctx.status = 400;
      ctx.body = {
        message: 'Phone and OTP are required',
        status: false,
        data: null
      };
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { phone }
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if already verified
    if (user.phone_verified) {
      ctx.status = 400;
      ctx.body = {
        message: 'Phone is already verified',
        status: false,
        data: null
      };
      return;
    }

    // Verify OTP
    if (user.phone_verification_token !== otp) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid OTP',
        status: false,
        data: null
      };
      return;
    }

    const duration = '2h';
    const accessToken = generateAccessToken(user, duration);

    // Update user verification status
    const updatedUser = await user.update({
      phone_verified: true,
      phone_verification_token: null,
      access_token: accessToken
    });

    // Check if both email and phone are verified to activate account
    if (user.email_verified) {
      await user.update({ status: '1' }); // Activate account
    }

    const refreshToken = generateRefreshToken(updatedUser);

    const responseData = {
      ...user.toJSON(),
      token: refreshToken,
      user_type: getUserType(user)
    };

    delete responseData.password;
    delete responseData.email_verification_token;
    delete responseData.phone_verification_token;

    ctx.status = 200;
    ctx.body = {
      message: 'Phone verified successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in verifyPhone:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to verify phone',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Resend email verification
const resendEmailVerification = async ctx => {
  try {
    const { email } = ctx.request.body;

    if (!email) {
      ctx.status = 400;
      ctx.body = {
        message: 'Email is required',
        status: false,
        data: null
      };
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if already verified
    if (user.email_verified) {
      ctx.status = 400;
      ctx.body = {
        message: 'Email is already verified',
        status: false,
        data: null
      };
      return;
    }

    // Generate new verification OTP
    const emailVerificationToken = 123456;
    // const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with new OTP
    await user.update({
      email_verification_token: emailVerificationToken
    });

    // Send email verification OTP using SendGrid
    await sendEmail(
      {
        email: user.email,
        subject: 'Email Verification OTP - Sanara Wellness',
        username: user.name,
        otp: emailVerificationToken
      },
      'welcomeEmailTemplate.html'
    );

    ctx.status = 200;
    ctx.body = {
      message: 'Email verification OTP sent successfully',
      status: true,
      data: null
    };
  } catch (err) {
    console.error('Error in resendEmailVerification:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to resend email verification',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Resend phone verification OTP
const resendPhoneVerification = async ctx => {
  try {
    const { email } = ctx.request.body;

    if (!email) {
      ctx.status = 400;
      ctx.body = {
        message: 'Email is required',
        status: false,
        data: null
      };
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if already verified
    if (user.phone_verified) {
      ctx.status = 400;
      ctx.body = {
        message: 'Phone is already verified',
        status: false,
        data: null
      };
      return;
    }

    // Generate new OTP
    const phoneVerificationToken = 123456;
    // const phoneVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with new OTP
    await user.update({
      phone_verification_token: phoneVerificationToken
    });

    // Send phone verification OTP using Twilio
    try {
      await smsService.sendOTP(user.phone, phoneVerificationToken);
      console.log(`SMS OTP sent successfully to ${user.phone}: ${phoneVerificationToken}`);
    } catch (smsError) {
      console.error('Failed to send SMS OTP:', smsError);

      // Provide more specific error messages based on Twilio error codes
      let errorMessage = 'Failed to send SMS OTP. Please try again later.';

      if (smsError.code === 21408) {
        errorMessage = 'SMS service is not available for your region. Please contact support.';
      } else if (smsError.code === 21211) {
        errorMessage = 'Invalid phone number format. Please check your phone number.';
      } else if (smsError.code === 21608) {
        errorMessage = 'SMS service temporarily unavailable. Please try again later.';
      } else if (smsError.code === 21659) {
        errorMessage = 'SMS service configuration error. Please contact support.';
      } else if (smsError.message && smsError.message.includes('Permission')) {
        errorMessage = 'SMS service not configured for your region. Please contact support.';
      } else if (smsError.message && smsError.message.includes('not a Twilio phone number')) {
        errorMessage = 'SMS service configuration error. Please contact support.';
      }

      ctx.status = 500;
      ctx.body = {
        message: errorMessage,
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Phone verification OTP sent successfully',
      status: true,
      data: null
    };
  } catch (err) {
    console.error('Error in resendPhoneVerification:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to resend phone verification',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resendForgotPasswordEmail,
  verifyResetToken,
  resetPassword,
  verifyUserAuth,
  logout,
  changePassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification
};
