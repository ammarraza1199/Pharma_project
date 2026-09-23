import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';
import { inMemoryUsers } from '../routes/auth.routes';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: string };
    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-passwordHash');
    }

    if (!user) {
      user = inMemoryUsers.find(u => u.id === decoded.id || u._id === decoded.id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient role.' });
    }
    next();
  };
};
