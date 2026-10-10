import { create } from 'zustand';
import { User, UserRole, UserStatus, SystemLimits, QueryPermission, AuthState } from '@/types/auth';

const STORAGE_USERS_KEY = 'datai_registered_users_v3';
const STORAGE_CURRENT_USER_KEY = 'datai_current_user_v3';
const STORAGE_LIMITS_KEY = 'datai_system_limits_v1';
const STORAGE_GUEST_QUERIES_KEY = 'datai_guest_queries_v1';

const DEFAULT_SYSTEM_LIMITS: SystemLimits = {
  guestLimit: 0,        // 0 free queries - strictly requires sign in or sign up
  userDailyLimit: 25,    // Daily queries for registered users
  enableGuestQueries: false,
};

export const DEFAULT_SUPER_ADMIN: User = {
  id: 'usr_super_admin_01',
  name: 'Super Admin (Bhanu)',
  email: 'admin@college.edu',
  role: 'SUPER_ADMIN',
  institution: 'College AI Administration',
  createdAt: Date.now() - 30 * 24 * 3600 * 1000,
  queryCount: 0,
  queryLimit: 999999,
  status: 'ACTIVE',
  password: 'Bhanu@2006',
};

export const DEFAULT_FACULTY_ADMIN: User = {
  id: 'usr_faculty_02',
  name: 'Prof. Surya Admin',
  email: 'faculty@college.edu',
  role: 'ADMIN',
  institution: 'Department of Computer Science',
  createdAt: Date.now() - 10 * 24 * 3600 * 1000,
  queryCount: 3,
  queryLimit: 999999,
  status: 'ACTIVE',
  password: 'Admin@2026',
};

export const DEFAULT_STUDENT_DEMO: User = {
  id: 'usr_student_03',
  name: 'Student Demo',
  email: 'student@college.edu',
  role: 'USER',
  institution: 'School of Engineering',
  createdAt: Date.now() - 5 * 24 * 3600 * 1000,
  queryCount: 2,
  queryLimit: 25,
  status: 'ACTIVE',
  password: 'Student@2026',
};

export const SEEDED_USERS: User[] = [
  DEFAULT_SUPER_ADMIN,
  DEFAULT_FACULTY_ADMIN,
  DEFAULT_STUDENT_DEMO,
];

function getInitialUsers(): User[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to ensure seed accounts always have updated demo passwords
          const merged = [...parsed];
          for (const seed of SEEDED_USERS) {
            const idx = merged.findIndex((u) => u.email.toLowerCase() === seed.email.toLowerCase());
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], password: seed.password, role: seed.role, status: 'ACTIVE' };
            } else {
              merged.push(seed);
            }
          }
          return merged;
        }
      }
    }
  } catch (_) {}
  return SEEDED_USERS;
}

function getInitialLimits(): SystemLimits {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_LIMITS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          guestLimit: 0,
          enableGuestQueries: false,
        };
      }
    }
  } catch (_) {}
  return DEFAULT_SYSTEM_LIMITS;
}

function getInitialGuestCount(): number {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_GUEST_QUERIES_KEY);
      if (stored) return parseInt(stored, 10) || 0;
    }
  } catch (_) {}
  return 0;
}

function getInitialCurrentUser(users: User[]): User | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          const matched = users.find((u) => u.email.toLowerCase() === parsed.email.toLowerCase());
          if (matched && matched.status === 'ACTIVE') return matched;
        }
      }
    }
  } catch (_) {}
  return null; // Don't auto-login by default so visitors see login / signup options
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUsers = getInitialUsers();
  const initialCurrent = getInitialCurrentUser(initialUsers);
  const initialLimits = getInitialLimits();
  const initialGuestCount = getInitialGuestCount();

  return {
    currentUser: initialCurrent,
    users: initialUsers,
    systemLimits: initialLimits,
    guestQueryCount: initialGuestCount,
    isAuthenticated: !!initialCurrent,
    isAuthModalOpen: false,
    isAdminModalOpen: false,
    isLimitModalOpen: false,
    limitModalReason: null,
    authMode: 'login',

    loadUsers: async () => {
      const users = getInitialUsers();
      const current = getInitialCurrentUser(users);
      const limits = getInitialLimits();
      const guestCount = getInitialGuestCount();
      set({
        users,
        currentUser: current,
        systemLimits: limits,
        guestQueryCount: guestCount,
        isAuthenticated: !!current,
      });
    },

    checkCanQuery: (): QueryPermission => {
      const { currentUser, guestQueryCount, systemLimits } = get();

      // 1. Super Admin and Admins have unlimited queries
      if (currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')) {
        return {
          allowed: true,
          remaining: 999999,
          limit: 999999,
          isUnlimited: true,
        };
      }

      // 2. Logged-in standard user check
      if (currentUser) {
        if (currentUser.status === 'PENDING') {
          return {
            allowed: false,
            remaining: 0,
            limit: 0,
            isUnlimited: false,
            reason: 'pending',
          };
        }

        if (currentUser.status === 'SUSPENDED') {
          return {
            allowed: false,
            remaining: 0,
            limit: 0,
            isUnlimited: false,
            reason: 'suspended',
          };
        }

        const userLimit = currentUser.queryLimit ?? systemLimits.userDailyLimit;
        const remaining = Math.max(0, userLimit - currentUser.queryCount);
        const allowed = remaining > 0;

        return {
          allowed,
          remaining,
          limit: userLimit,
          isUnlimited: false,
          reason: allowed ? undefined : 'user_limit',
        };
      }

      // 3. Guest (Not Logged In) - strictly requires sign in or sign up
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        isUnlimited: false,
        reason: 'guest_limit',
      };
    },

    incrementQueryCount: async () => {
      const { currentUser, users, guestQueryCount } = get();

      if (currentUser) {
        const newCount = (currentUser.queryCount || 0) + 1;
        const updatedCurrent = { ...currentUser, queryCount: newCount };
        const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedCurrent : u));

        set({ currentUser: updatedCurrent, users: updatedUsers });
        try {
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
        } catch (_) {}
      } else {
        const newGuest = guestQueryCount + 1;
        set({ guestQueryCount: newGuest });
        try {
          localStorage.setItem(STORAGE_GUEST_QUERIES_KEY, newGuest.toString());
        } catch (_) {}
      }
    },

    updateSystemLimits: async (newLimits: Partial<SystemLimits>) => {
      const updated = { ...get().systemLimits, ...newLimits };
      set({ systemLimits: updated });
      try {
        localStorage.setItem(STORAGE_LIMITS_KEY, JSON.stringify(updated));
      } catch (_) {}
    },

    resetUserQueries: async (userId: string) => {
      const users = get().users.map((u) => (u.id === userId ? { ...u, queryCount: 0 } : u));
      let current = get().currentUser;
      if (current && current.id === userId) {
        current = { ...current, queryCount: 0 };
      }
      set({ users, currentUser: current });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        if (current) localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(current));
      } catch (_) {}
    },

    resetAllQueries: async () => {
      const users = get().users.map((u) => ({ ...u, queryCount: 0 }));
      let current = get().currentUser;
      if (current) {
        current = { ...current, queryCount: 0 };
      }
      set({ users, currentUser: current, guestQueryCount: 0 });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        if (current) localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(current));
        localStorage.setItem(STORAGE_GUEST_QUERIES_KEY, '0');
      } catch (_) {}
    },

    createUser: async (userData: Omit<User, 'id' | 'createdAt'>) => {
      const cleanEmail = userData.email.trim().toLowerCase();
      if (!userData.name.trim()) return { success: false, error: 'User name is required.' };
      if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Valid email is required.' };

      const users = get().users;
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'A user with this email already exists.' };
      }

      const newUser: User = {
        ...userData,
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: userData.name.trim(),
        email: cleanEmail,
        createdAt: Date.now(),
        queryCount: 0,
        status: userData.status || 'ACTIVE',
      };

      const updatedUsers = [newUser, ...users];
      set({ users: updatedUsers });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
      } catch (_) {}

      return { success: true };
    },

    updateUser: async (userId: string, updates: Partial<User>) => {
      const users = get().users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      let current = get().currentUser;
      if (current && current.id === userId) {
        current = { ...current, ...updates };
      }
      set({ users, currentUser: current });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        if (current) localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(current));
      } catch (_) {}
    },

    updateUserStatus: async (userId: string, status: UserStatus) => {
      await get().updateUser(userId, { status });
      try {
        await fetch(`/api/auth/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch (_) {}
    },

    approveUser: async (userId: string) => {
      await get().updateUserStatus(userId, 'ACTIVE');
    },

    login: async (email: string, password: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const users = get().users;
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return { success: false, error: 'No account found with this email. Please create an account.' };
      }

      // Check password
      if (user.password && user.password !== cleanPassword) {
        return { success: false, error: 'Incorrect password. Please verify your credentials.' };
      }

      // Check if access is pending Super Admin approval
      if (user.status === 'PENDING') {
        return {
          success: false,
          error: 'Access Pending: Your account is currently awaiting access approval from the Super Admin (admin@college.edu).',
        };
      }

      if (user.status === 'SUSPENDED') {
        return { success: false, error: 'This account has been suspended by the administrator.' };
      }

      if (cleanPassword.length < 3) {
        return { success: false, error: 'Password must be at least 3 characters long.' };
      }

      set({ currentUser: user, isAuthenticated: true, isAuthModalOpen: false, isLimitModalOpen: false });
      try {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      } catch (_) {}

      return { success: true };
    },

    signup: async (name: string, email: string, password: string, institution?: string) => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanName) return { success: false, error: 'Name is required.' };
      if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Please enter a valid email.' };
      if (cleanPassword.length < 4) return { success: false, error: 'Password must be at least 4 characters long.' };

      const users = get().users;
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      const isSuperAdminEmail = cleanEmail === 'admin@college.edu' || cleanEmail === 'admin@datai.edu';
      const role: UserRole = isSuperAdminEmail ? 'SUPER_ADMIN' : 'USER';
      // New users start as PENDING for Super Admin to grant access!
      const status: UserStatus = isSuperAdminEmail ? 'ACTIVE' : 'PENDING';

      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role,
        status,
        institution: institution?.trim() || 'College Member',
        createdAt: Date.now(),
        queryCount: 0,
        queryLimit: role === 'SUPER_ADMIN' ? 999999 : get().systemLimits.userDailyLimit,
      };

      const updatedUsers = [newUser, ...users];
      set({ users: updatedUsers });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
      } catch (_) {}

      // Send to backend server as well
      try {
        await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            institution: newUser.institution,
          }),
        });
      } catch (_) {}

      if (status === 'PENDING') {
        return {
          success: true,
          pendingApproval: true,
          message:
            'Registration submitted! Your account has been received and is waiting for Super Admin (admin@college.edu) approval. Once approved, you can log in.',
        };
      }

      set({
        currentUser: newUser,
        isAuthenticated: true,
        isAuthModalOpen: false,
        isLimitModalOpen: false,
      });
      try {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser));
      } catch (_) {}

      return { success: true };
    },

    loginAsSuperAdmin: async () => {
      const superAdmin = get().users.find((u) => u.role === 'SUPER_ADMIN') || DEFAULT_SUPER_ADMIN;
      set({ currentUser: superAdmin, isAuthenticated: true, isAuthModalOpen: false, isLimitModalOpen: false });
      try {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(superAdmin));
      } catch (_) {}
    },

    logout: () => {
      set({ currentUser: null, isAuthenticated: false });
      try {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      } catch (_) {}
    },

    openAuthModal: (mode: 'login' | 'signup' = 'login') => {
      set({ isAuthModalOpen: true, authMode: mode, isLimitModalOpen: false });
    },

    closeAuthModal: () => {
      set({ isAuthModalOpen: false });
    },

    openLimitModal: (reason: 'guest' | 'user' = 'guest') => {
      set({ isLimitModalOpen: true, limitModalReason: reason });
    },

    closeLimitModal: () => {
      set({ isLimitModalOpen: false, limitModalReason: null });
    },

    setAdminModalOpen: (open: boolean) => {
      set({ isAdminModalOpen: open });
    },

    updateUserRole: async (userId: string, role: UserRole) => {
      const users = get().users.map((u) => (u.id === userId ? { ...u, role } : u));
      let current = get().currentUser;
      if (current && current.id === userId) {
        current = { ...current, role };
      }
      set({ users, currentUser: current });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        if (current) localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(current));
        await fetch(`/api/auth/users/${userId}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
      } catch (_) {}
    },

    deleteUser: async (userId: string) => {
      const users = get().users.filter((u) => u.id !== userId);
      set({ users });
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        await fetch(`/api/auth/users/${userId}`, { method: 'DELETE' });
      } catch (_) {}
    },
  };
});
