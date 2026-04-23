import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserSettingsModel } from '../models';
import { logger } from '../lib/Logger';
import { generateToken, verifyToken } from '../lib/jwt';
import type { ApiResponse, LoginRequest, RegisterRequest, AuthResponse, JwtPayload } from '../types';

// =========================================================
// TalentIQ — Authentication Controller
// =========================================================

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, role, company, jobTitle }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      } satisfies ApiResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'recruiter',
      company,
      jobTitle,
      profileCompletion: 0,
    });

    // Create default settings
    await UserSettingsModel.create({
      userId: user._id.toString(),
      notifications: {
        emailNewApplicants: true,
        emailScreeningAlerts: true,
        emailWeeklySummary: true,
      },
    });

    // Generate token
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);

    const authResponse: AuthResponse = {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        company: user.company,
        jobTitle: user.jobTitle,
        profileCompletion: user.profileCompletion,
        createdAt: (user as any).createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: (user as any).updatedAt?.toISOString() || new Date().toISOString(),
      },
      token,
    };

    logger.info(`[Auth] User registered: ${email}`);

    return res.status(201).json({
      success: true,
      data: authResponse,
      message: 'Registration successful',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Auth] register error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
    } satisfies ApiResponse);
  }
}

/**
 * POST /api/auth/login
 * Login user with email and password
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } satisfies ApiResponse);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } satisfies ApiResponse);
    }

    // Generate token
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);

    const authResponse: AuthResponse = {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        company: user.company,
        jobTitle: user.jobTitle,
        profileCompletion: user.profileCompletion,
        createdAt: (user as any).createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: (user as any).updatedAt?.toISOString() || new Date().toISOString(),
      },
      token,
    };

    logger.info(`[Auth] User logged in: ${email}`);

    return res.json({
      success: true,
      data: authResponse,
      message: 'Login successful',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Auth] login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to login',
    } satisfies ApiResponse);
  }
}

/**
 * GET /api/auth/me
 * Get current user from token
 */
export async function getMe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse);
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } satisfies ApiResponse);
    }

    const userProfile = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      company: user.company,
      jobTitle: user.jobTitle,
      profileCompletion: user.profileCompletion,
      createdAt: (user as any).createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: (user as any).updatedAt?.toISOString() || new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: userProfile,
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Auth] getMe error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    } satisfies ApiResponse);
  }
}
