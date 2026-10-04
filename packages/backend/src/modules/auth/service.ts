import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JwtPayload } from '../../common/auth.js';
import { config } from '../../config/index.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (user: { id: string; email: string; role: string }): TokenPair => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const login = async (email: string, password: string): Promise<{ user: any; tokens: TokenPair }> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      department: true,
      campus: true,
    },
  });

  if (!user) {
    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Usuario inactivo', 403, 'USER_INACTIVE');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  // Store refresh token hash in database (optional, for revocation)
  const refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: user.passwordHash }, // Just to trigger update, we could add a refreshTokenHash field
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'TECNICO' | 'SOLICITANTE';
  departmentId?: string;
  campusId?: string;
}): Promise<{ user: any; tokens: TokenPair }> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('El email ya está registrado', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      departmentId: data.departmentId,
      campusId: data.campusId,
    },
    include: {
      department: true,
      campus: true,
    },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

export const refreshTokens = async (refreshToken: string): Promise<TokenPair> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuario no encontrado o inactivo', 401, 'USER_NOT_FOUND');
    }

    return generateTokens({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Token de actualización inválido o expirado', 401, 'INVALID_REFRESH_TOKEN');
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Contraseña actual incorrecta', 400, 'INVALID_PASSWORD');
  }

  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
};

export const requestPasswordReset = async (email: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success for security (don't reveal if email exists)
  if (!user) return 'ok';

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  // In a real implementation, you'd store this in a separate table
  // For now, we'll just return the token (in production, send via email)
  console.log(`Password reset token for ${email}: ${resetToken}`);

  // TODO: Send email with reset link
  // await sendResetEmail(user.email, resetToken);

  return 'ok';
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // In a real implementation, you'd look up the token in the database
  // For now, this is a placeholder
  throw new AppError('Funcionalidad no implementada completamente', 501, 'NOT_IMPLEMENTED');
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      campusId: true,
      createdAt: true,
      lastLoginAt: true,
      department: true,
      campus: true,
    },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  return user;
};

export const updateProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      campusId: true,
      createdAt: true,
      lastLoginAt: true,
      department: true,
      campus: true,
    },
  });

  return user;
};