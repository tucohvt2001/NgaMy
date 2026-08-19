import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types/express';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  email: string;
  roleId: string;
  roleName: string;
  memberId: string | null;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}

export function toAuthUser(payload: AccessTokenPayload): AuthUser {
  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email,
    roleId: payload.roleId,
    roleName: payload.roleName,
    memberId: payload.memberId,
    permissions: payload.permissions,
  };
}
