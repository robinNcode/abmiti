import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../shared/utils/errors';
import { AuthTokens, JwtPayload, IUser } from '../../shared/types';
import { container } from '../../container';

interface RegisterDto { name: string; email: string; password: string; }
interface LoginDto { email: string; password: string; }
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
    console.log(dto);
    const exists = await container.userRepo.findByEmail(dto.email);
    if (exists) throw new ConflictError('Email already registered');
    const user = await container.userRepo.create(dto);
    return { user, tokens: signTokens(user) };
  },

  async login(dto: LoginDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await container.userRepo.findByEmail(dto.email, true);
    console.log(user);
    console.log(dto);
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
    const user = await container.userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedError('User not found');
    return signTokens(user);
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
    const user = await container.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  },
};
