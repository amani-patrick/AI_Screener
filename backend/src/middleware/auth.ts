import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { logger } from '../lib/Logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Attach user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;

    next();
  } catch (error) {
    logger.error('[Auth] Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
}

// Optional authentication - doesn't fail if no token, but sets user info if token exists
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.userRole = payload.role;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    logger.warn('[Auth] Optional auth failed, continuing:', error);
    next();
  }
}
