import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserSettingsModel } from '../models';
import { logger } from '../lib/Logger';
import type { ApiResponse, UserProfile, UserSettings } from '../types';

// =========================================================
// TalentIQ — User Profile & Settings Controller
// =========================================================

/**
 * Calculate profile completion percentage based on filled fields
 */
function calculateProfileCompletion(user: any): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.company,
    user.jobTitle,
  ];
  const filledFields = fields.filter((field) => field && field.trim().length > 0);
  return Math.round((filledFields.length / fields.length) * 100);
}

/**
 * GET /api/user/profile
 * Returns the current user's profile
 */
export async function getUserProfile(req: Request, res: Response) {
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
    
    const profile: UserProfile = {
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
    
    logger.info(`[User] Profile fetched: ${userId}`);
    
    return res.json({
      success: true,
      data: profile,
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] getUserProfile error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user profile' 
    } satisfies ApiResponse);
  }
}

/**
 * PUT /api/user/profile
 * Updates the current user's profile
 */
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse);
    }

    const { firstName, lastName, email, company, jobTitle } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        email, 
        company, 
        jobTitle,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } satisfies ApiResponse);
    }

    // Recalculate profile completion
    const profileCompletion = calculateProfileCompletion(user);
    user.profileCompletion = profileCompletion;
    await user.save();

    const profile: UserProfile = {
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
    
    logger.info(`[User] Profile updated: ${userId}`);
    
    return res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] updateUserProfile error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update user profile' 
    } satisfies ApiResponse);
  }
}

/**
 * GET /api/user/settings
 * Returns the current user's settings
 */
export async function getUserSettings(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse);
    }

    let settings = await UserSettingsModel.findOne({ userId });

    // Create default settings if not exists
    if (!settings) {
      settings = await UserSettingsModel.create({
        userId,
        geminiApiKey: '',
        notifications: {
          emailNewApplicants: true,
          emailScreeningAlerts: true,
          emailWeeklySummary: true,
        },
      });
      logger.info(`[User] Created default settings: ${userId}`);
    }
    
    const userSettings: UserSettings = {
      userId: settings.userId,
      geminiApiKey: settings.geminiApiKey,
      notifications: settings.notifications,
      updatedAt: (settings as any).updatedAt?.toISOString() || new Date().toISOString(),
    };
    
    logger.info(`[User] Settings fetched: ${userId}`);
    
    return res.json({
      success: true,
      data: userSettings,
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] getUserSettings error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user settings' 
    } satisfies ApiResponse);
  }
}

/**
 * PUT /api/user/settings
 * Updates the current user's settings
 */
export async function updateUserSettings(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse);
    }

    const { geminiApiKey, notifications } = req.body;
    
    const settings = await UserSettingsModel.findOneAndUpdate(
      { userId },
      { 
        geminiApiKey, 
        notifications,
        updatedAt: new Date().toISOString(),
      },
      { new: true, runValidators: true, upsert: true }
    );
    
    const userSettings: UserSettings = {
      userId: settings.userId,
      geminiApiKey: settings.geminiApiKey,
      notifications: settings.notifications,
      updatedAt: (settings as any).updatedAt?.toISOString() || new Date().toISOString(),
    };
    
    logger.info(`[User] Settings updated: ${userId}`);
    
    return res.json({
      success: true,
      data: userSettings,
      message: 'Settings updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] updateUserSettings error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update user settings' 
    } satisfies ApiResponse);
  }
}

/**
 * PUT /api/user/api-key
 * Updates just the Gemini API key
 */
export async function updateApiKey(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse);
    }

    const { geminiApiKey } = req.body;
    
    const settings = await UserSettingsModel.findOneAndUpdate(
      { userId },
      { 
        geminiApiKey,
        updatedAt: new Date().toISOString(),
      },
      { new: true, runValidators: true, upsert: true }
    );
    
    logger.info(`[User] API key updated: ${userId}`);
    
    return res.json({
      success: true,
      data: { geminiApiKey: settings?.geminiApiKey ? '••••••••••••••••' : '' },
      message: 'API key updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] updateApiKey error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update API key' 
    } satisfies ApiResponse);
  }
}

/**
 * GET /api/me
 * Quick endpoint to get current user info (for dashboard profile card)
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

    let user = await User.findById(userId);

    // Create default user if not exists
    if (!user) {
      user = await User.create({
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'recruiter@test.com',
        password: await bcrypt.hash('defaultPassword123', 10),
        role: 'manager',
        company: 'Umurava',
        jobTitle: 'Company Admin / Manager',
        profileCompletion: 80,
      });
    }
    
    return res.json({
      success: true,
      data: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
        profileCompletion: user.profileCompletion,
        initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[User] getMe error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user info' 
    } satisfies ApiResponse);
  }
}
