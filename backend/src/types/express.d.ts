// Payload đính kèm vào req.user sau khi xác thực JWT thành công
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roleId: string;
  roleName: string;
  memberId: string | null;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
