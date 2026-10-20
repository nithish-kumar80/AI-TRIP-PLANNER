const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, sanitizeUser } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { AppError } = require('../middleware/errorHandler');

exports.register = async ({ name, email, password }, userAgent, ipAddress, clientUrl) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered.', 409);

  const user = new User({ name, email, password, provider: 'local' });
  const verificationToken = user.generateEmailVerificationToken();
  user.calculateProfileCompletion();
  await user.save();

  // Send verification email (non-blocking)
  sendVerificationEmail(email, name, verificationToken, clientUrl).catch(console.error);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id, userAgent, ipAddress);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

exports.login = async ({ email, password }, userAgent, ipAddress) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (user.provider === 'google') throw new AppError('This account uses Google Sign-In. Please login with Google.', 401);
  if (!user.password) throw new AppError('Invalid email or password.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  // In production only: require email verification
  // if (!user.isVerified) throw new AppError('Please verify your email before logging in.', 403);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id, userAgent, ipAddress);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};


exports.logout = async (refreshToken) => {
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
  }
};

exports.refreshTokens = async (oldRefreshToken, userAgent, ipAddress) => {
  const tokenDoc = await RefreshToken.findOne({ token: oldRefreshToken, isRevoked: false });
  if (!tokenDoc) throw new AppError('Invalid refresh token.', 401);
  if (tokenDoc.expiresAt < new Date()) {
    await RefreshToken.findByIdAndUpdate(tokenDoc._id, { isRevoked: true });
    throw new AppError('Refresh token expired. Please login again.', 401);
  }

  const newAccessToken = generateAccessToken(tokenDoc.user);
  const newRefreshToken = await generateRefreshToken(tokenDoc.user, userAgent, ipAddress);
  await RefreshToken.findByIdAndUpdate(tokenDoc._id, { isRevoked: true, replacedByToken: newRefreshToken });

  const user = await User.findById(tokenDoc.user);
  return { user: sanitizeUser(user), accessToken: newAccessToken, refreshToken: newRefreshToken };
};

exports.verifyEmail = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError('Invalid or expired verification token.', 400);

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return sanitizeUser(user);
};

exports.forgotPassword = async (email, clientUrl) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with this email address.', 404);
  if (user.provider === 'google') throw new AppError('This account uses Google Sign-In.', 400);

  const resetToken = user.generatePasswordResetToken();
  await user.save();
  await sendPasswordResetEmail(email, user.name, resetToken, clientUrl);
};

exports.resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user.password) throw new AppError('This account uses Google Sign-In.', 400);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);
  user.password = newPassword;
  await user.save();
};
