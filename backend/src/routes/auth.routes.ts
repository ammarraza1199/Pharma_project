import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { StoreSettings } from '../models/StoreSettings';
import { config } from '../config/env';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

const signToken = (id: string, email: string, role: string) =>
  jwt.sign({ id, email, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pharmacistName, pharmacyName, licenseNo, email, password } = req.body;
    if (!pharmacistName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ pharmacistName, pharmacyName: pharmacyName || '', licenseNo: licenseNo || '', email: email.toLowerCase(), passwordHash });
    const token = signToken(user._id.toString(), user.email, user.role);
    res.status(201).json({ success: true, token, user: { id: user._id, pharmacistName: user.pharmacistName, pharmacyName: user.pharmacyName, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Check lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({ success: false, message: `Account locked. Try again in ${mins} min.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.', attemptsLeft: Math.max(0, 5 - user.loginAttempts) });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = signToken(user._id.toString(), user.email, user.role);
    res.json({ success: true, token, user: { id: user._id, pharmacistName: user.pharmacistName, pharmacyName: user.pharmacyName, licenseNo: user.licenseNo, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash');
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // TODO: send email with reset link containing raw token
    console.log(`[DEV] Password reset token for ${email}: ${token}`);
    res.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-manager-pin
router.post('/verify-manager-pin', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN required.' });
    const settings = await StoreSettings.findOne();
    if (!settings) return res.status(500).json({ success: false, message: 'Store settings not found.' });
    const isValid = await bcrypt.compare(pin, settings.managerPin);
    res.json({ success: true, authorized: isValid, message: isValid ? 'PIN verified.' : 'Invalid manager PIN.' });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-owner-pin
router.post('/verify-owner-pin', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN required.' });
    const settings = await StoreSettings.findOne();
    if (!settings) return res.status(500).json({ success: false, message: 'Store settings not found.' });
    const isValid = await bcrypt.compare(pin, settings.ownerPin);
    res.json({ success: true, authorized: isValid, message: isValid ? 'PIN verified.' : 'Invalid owner PIN.' });
  } catch (err) { next(err); }
});

export default router;
