const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { name, email, password }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --- Basic request validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // --- Check for existing user ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // --- Create user (password hashed automatically via pre-save hook) ---
    const user = await User.create({ name, email, password });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a token
 * @access  Public
 * @body    { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // password is select:false by default, so request it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user's profile
 * @access  Private (requires Bearer token)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the `protect` middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout the current user
 * @access  Private (requires Bearer token)
 *
 * NOTE: JWTs are stateless. The server does not store sessions, so there is
 * nothing to "invalidate" here without an extra token blacklist/store
 * (e.g. Redis). The standard approach is for the CLIENT to delete the token
 * from storage (AsyncStorage) -- which is what authService.logout() does on
 * the frontend. This endpoint exists mainly as a confirmation hook and as a
 * place to plug in token-blacklisting later if needed.
 */
const logout = async (req, res, next) => {
  try {
    return res.json({
      message: 'Logged out successfully. Remove the token from client storage.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, logout };
