export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  institution?: string;
  createdAt: number;
  queryCount: number;
  queryLimit?: number; // Custom per-user override, or null for system default
  status: UserStatus;
  password?: string;
}

export interface SystemLimits {
  guestLimit: number; // Free queries allowed before requiring signup (e.g. 5)
  userDailyLimit: number; // Daily queries allowed for registered users (e.g. 25)
  enableGuestQueries: boolean; // Whether guests can query at all before signing up
}

export interface QueryPermission {
  allowed: boolean;
  remaining: number;
  limit: number;
  isUnlimited: boolean;
  reason?: 'guest_limit' | 'user_limit' | 'suspended' | 'pending';
}

export interface AuthState {
  currentUser: User | null;
  users: User[];
  systemLimits: SystemLimits;
  guestQueryCount: number;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isAdminModalOpen: boolean;
  isLimitModalOpen: boolean;
  limitModalReason: 'guest' | 'user' | null;
  authMode: 'login' | 'signup';
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, institution?: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean; message?: string }>;
  loginAsSuperAdmin: () => Promise<void>;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  openLimitModal: (reason?: 'guest' | 'user') => void;
  closeLimitModal: () => void;
  setAdminModalOpen: (open: boolean) => void;
  checkCanQuery: () => QueryPermission;
  incrementQueryCount: () => Promise<void>;
  updateSystemLimits: (limits: Partial<SystemLimits>) => Promise<void>;
  resetUserQueries: (userId: string) => Promise<void>;
  resetAllQueries: () => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  loadUsers: () => Promise<void>;
}
