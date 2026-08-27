const prisma = require('../utils/prisma');
const config = require('../config');
const tokenService = require('../services/token.service');
const bcrypt = require('bcryptjs');

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'CLIENT'
      }
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { password: _, refreshToken: __, ...userData } = user;

    res.status(201).json({
      success: true,
      data: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { password: _, refreshToken: __, ...userData } = user;

    res.status(200).json({
      success: true,
      data: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    
    // Verify token
    const payload = tokenService.verifyRefreshToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout };
