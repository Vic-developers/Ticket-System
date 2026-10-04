import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as authService from './service.js';
import { config } from '../../config/index.js';

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);
  
  setRefreshTokenCookie(res, tokens.refreshToken);
  
  res.json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
  });
});

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user, tokens } = await authService.register(req.body);
  
  setRefreshTokenCookie(res, tokens.refreshToken);
  
  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Refresh token requerido',
    });
  }
  
  const tokens = await authService.refreshTokens(refreshToken);
  
  setRefreshTokenCookie(res, tokens.refreshToken);
  
  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

export const logout = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  clearRefreshTokenCookie(res);
  
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }
  
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  
  res.json({
    success: true,
    message: 'Contraseña actualizada correctamente',
  });
});

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  
  res.json({
    success: true,
    message: 'Si el email existe, se enviará un enlace de recuperación',
  });
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  
  res.json({
    success: true,
    message: 'Contraseña restablecida correctamente',
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }
  
  const profile = await authService.getProfile(req.user.id);
  
  res.json({
    success: true,
    data: profile,
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }
  
  const profile = await authService.updateProfile(req.user.id, req.body);
  
  res.json({
    success: true,
    data: profile,
  });
});