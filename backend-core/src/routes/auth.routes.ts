import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user (password will be hashed by the pre-save hook)
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not defined');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication configuration error',
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    logger.info('User registered successfully', {
      userId: user._id.toString(),
      email: user.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    logger.error('Registration error', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    if (!user.password) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not defined');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication configuration error',
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    logger.info('User logged in successfully', {
      userId: user._id.toString(),
      email: user.email,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    logger.error('Login error', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    logger.info('User logged out', {
      userId: req.user?.userId,
      email: req.user?.email,
    });

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error', {
      error: (error as Error).message,
    });
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user information
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Fetch full user details from database
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
      return;
    }

    logger.debug('User info retrieved', {
      userId: user._id.toString(),
      email: user.email,
    });

    res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: (user as any).role,
      },
    });
  } catch (error) {
    logger.error('Get user info error', {
      error: (error as Error).message,
    });
    next(error);
  }
});

export default router;
