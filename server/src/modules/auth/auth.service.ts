import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../shared/utils/errors';
import { AuthTokens, JwtPayload } from '../../shared/types';
import { User } from './auth.model';
import { IUser } from '../../shared/types';

interface RegisterDto { name: string; email: string; password: string; }
interface LoginDto    { email: string; password: string; }
interface UpdateProfileDto { budget?: number; }

const signTokens = (user: IUser): AuthTokens => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: String(user._id),
    email: user.email,
  };
  return {
    accessToken: jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions),
    refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions),
  };
};

export const authService = {
  async register(dto: RegisterDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const exists = await User.findOne({ email: dto.email });
    if (exists) throw new ConflictError('Email already registered');
    const user = await User.create(dto);
    return { user, tokens: signTokens(user) };
  },

  async login(dto: LoginDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email: dto.email }).select('+password');
    if (!user || !(await user.comparePassword(dto.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return { user, tokens: signTokens(user) };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const user = await User.findById(payload.userId);
    if (!user) throw new UnauthorizedError('User not found');
    return signTokens(user);
  },

  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  },

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    if (dto.budget !== undefined) user.budget = dto.budget;
    await user.save();
    return user;
  },
};
