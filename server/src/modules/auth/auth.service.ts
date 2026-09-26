import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../shared/utils/errors';
import { AuthTokens, JwtPayload, IUser } from '../../shared/types';
import { container } from '../../container';
import bcrypt from 'bcryptjs';

interface RegisterDto { name: string; email: string; password: string; }
interface LoginDto { email: string; password: string; }
interface UpdateProfileDto { budget?: number; name?: string; avatar?: string; }

export const signTokensForUser = (user: IUser): AuthTokens => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: String(user._id),
    email: user.email,
    userType: user.userType ?? 'user',
  };
  return {
    accessToken: jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions),
    refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions),
  };
};

export const authService = {
  signTokensForUser,

  async register(dto: RegisterDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    console.log(dto);
    const exists = await container.userRepo.findByEmail(dto.email);
    if (exists) throw new ConflictError('Email already registered');
    const user = await container.userRepo.create({ name: dto.name, email: dto.email, password: dto.password });
    return { user, tokens: signTokensForUser(user) };
  },

  async login(dto: LoginDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await container.userRepo.findByEmail(dto.email, true);
    
    if (!user || !(await user.comparePassword(dto.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return { user, tokens: signTokensForUser(user) };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      payload = decoded as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const user = await container.userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedError('User not found');
    return signTokensForUser(user);
  },

  async getMe(userId: string): Promise<IUser> {
    const user = await container.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  },

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<IUser> {
    if (dto.budget !== undefined) {
      const updated = await container.userRepo.updateBudget(userId, dto.budget);
      if (!updated) throw new UnauthorizedError('User not found');
      return updated;
    }
    if (dto.name !== undefined || dto.avatar !== undefined) {
      const updated = await container.userRepo.updateProfile(userId, {
        name: dto.name,
        avatar: dto.avatar,
      });
      if (!updated) throw new UnauthorizedError('User not found');
      return updated;
    }
    const user = await container.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  },
};

