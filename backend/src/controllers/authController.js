const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dateOfBirth } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already registered');

  const user  = await User.create({ name, email, password, phone, dateOfBirth, role: 'patient' });
  const token = signToken(user._id);

  res.status(201).json({ success: true, token, user: user.toJSON() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password required');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  if (!user.isActive) throw ApiError.unauthorized('Account deactivated');

  const token = signToken(user._id);
  res.json({ success: true, token, user: user.toJSON() });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

module.exports = { register, login, getMe };