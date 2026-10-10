import React, { useState } from 'react';
import {
  Crown,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Activity,
  Database,
  X,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Sliders,
  RotateCcw,
  UserPlus,
  Save,
  Search,
  Filter,
  Zap,
  Lock,
  Unlock,
  Check,
  Edit2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { UserRole, UserStatus, User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export function AdminModal() {
  const {
    isAdminModalOpen,
    setAdminModalOpen,
    currentUser,
    users,
    systemLimits,
    guestQueryCount,
    updateUserRole,
    updateUser,
    updateUserStatus,
    approveUser,
    createUser,
    deleteUser,
    resetUserQueries,
    resetAllQueries,
    updateSystemLimits,
  } = useAuthStore();

  const { isBackendConnected, geminiModel, backendUrl } = useSettingsStore();

  // Super Admin Global API Key Management
  const [globalApiKeyInput, setGlobalApiKeyInput] = useState('');
  const [globalModelInput, setGlobalModelInput] = useState('gemini-flash-latest');
  const [apiKeyTesting, setApiKeyTesting] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState<{ success: boolean; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'users' | 'limits' | 'system'>('users');
  const [filterQuery, setFilterQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  // Limit Settings Form State
  const [guestLimitInput, setGuestLimitInput] = useState(systemLimits.guestLimit);
  const [userLimitInput, setUserLimitInput] = useState(systemLimits.userDailyLimit);
  const [enableGuestInput, setEnableGuestInput] = useState(systemLimits.enableGuestQueries);
  const [limitsSavedToast, setLimitsSavedToast] = useState(false);
  const [resetAllToast, setResetAllToast] = useState(false);

  // Add User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('USER');
  const [newUserInstitution, setNewUserInstitution] = useState('');
  const [newUserLimit, setNewUserLimit] = useState(25);
  const [addUserError, setAddUserError] = useState('');

  // Edit Quota Modal State
  const [editingUserQuota, setEditingUserQuota] = useState<User | null>(null);
  const [customQuotaInput, setCustomQuotaInput] = useState<number>(25);

  if (!isAdminModalOpen || !currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Metrics
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;
  const totalQueriesConsumed = users.reduce((acc, u) => acc + (u.queryCount || 0), 0) + guestQueryCount;

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (u.institution && u.institution.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSystemLimits({
      guestLimit: Math.max(1, Number(guestLimitInput)),
      userDailyLimit: Math.max(1, Number(userLimitInput)),
      enableGuestQueries: Boolean(enableGuestInput),
    });
    setLimitsSavedToast(true);
    setTimeout(() => setLimitsSavedToast(false), 3000);
  };

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all query counts for all users and guests to 0?')) {
      await resetAllQueries();
      setResetAllToast(true);
      setTimeout(() => setResetAllToast(false), 3000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');

    const res = await createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      institution: newUserInstitution || 'College Member',
      queryCount: 0,
      queryLimit: newUserRole === 'SUPER_ADMIN' ? 999999 : newUserLimit,
      status: 'ACTIVE',
    });

    if (res.success) {
      setNewUserName('');
      setNewUserEmail('');
      setNewUserInstitution('');
      setNewUserLimit(25);
      setShowAddUserModal(false);
    } else {
      setAddUserError(res.error || 'Failed to create user');
    }
  };

  const handleSaveCustomQuota = async () => {
    if (!editingUserQuota) return;
    await updateUser(editingUserQuota.id, { queryLimit: Number(customQuotaInput) });
    setEditingUserQuota(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={() => setAdminModalOpen(false)}
      />

      {/* Admin Console Card */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden z-10 animate-scale-in flex flex-col">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border bg-surface-elevated/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary tracking-tight font-sans">
                  Super Admin Management Console
                </h2>
                <Badge variant="saffron" size="sm">
                  Super Admin Exclusive
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Configure ChatGPT-style rate limits, manage student accounts, quotas, and permissions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setAdminModalOpen(false)}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="Close console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-surface-elevated/20 px-6 pt-2 gap-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & Quotas ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'limits'
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Rate Limits & System Quotas</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Health & Diagnostics</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Summary Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 bg-surface-elevated/40 border-border">
                  <span className="text-[10px] font-mono text-text-muted uppercase">Total Users</span>
                  <p className="text-xl font-bold text-text-primary font-mono">{totalUsers}</p>
                </Card>
                <Card className="p-3 bg-surface-elevated/40 border-border">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase">Active Accounts</span>
                  <p className="text-xl font-bold text-emerald-500 font-mono">{activeCount}</p>
                </Card>
                <Card className="p-3 bg-surface-elevated/40 border-border">
                  <span className="text-[10px] font-mono text-danger uppercase">Suspended</span>
                  <p className="text-xl font-bold text-danger font-mono">{suspendedCount}</p>
                </Card>
                <Card className="p-3 bg-surface-elevated/40 border-border">
                  <span className="text-[10px] font-mono text-accent uppercase">Queries Consumed</span>
                  <p className="text-xl font-bold text-accent-dark font-mono">{totalQueriesConsumed}</p>
                </Card>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, department..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-surface-elevated border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="USER">Student/User</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-surface-elevated border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddUserModal(true)}
                    className="text-xs gap-1.5 py-1.5 px-3 rounded-xl"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] font-mono border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Institution</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">AI Usage & Quota</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isUnlimited = u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
                      const quotaLimit = u.queryLimit ?? systemLimits.userDailyLimit;

                      return (
                        <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                          {/* User Name & Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center font-bold text-text-primary text-xs shrink-0 shadow-2xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-text-primary block truncate">
                                  {u.name} {isSelf && <span className="text-accent font-normal">(You)</span>}
                                </span>
                                <span className="text-[11px] text-text-muted font-mono block truncate">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Institution */}
                          <td className="py-3 px-4 text-text-secondary truncate max-w-[140px]">
                            {u.institution || '—'}
                          </td>

                          {/* Role Selection Dropdown */}
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                              className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer focus:outline-none ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-accent/15 border-accent text-accent-dark'
                                  : u.role === 'ADMIN'
                                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                                  : 'bg-surface-elevated border-border text-text-secondary'
                              } ${isSelf ? 'opacity-80 cursor-not-allowed' : ''}`}
                            >
                              <option value="SUPER_ADMIN">👑 Super Admin</option>
                              <option value="ADMIN">🛡️ Admin</option>
                              <option value="USER">🎓 Student / User</option>
                            </select>
                          </td>

                          {/* Usage & Quota Meter */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isUnlimited ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <Zap className="w-3 h-3" />
                                  <span>Unlimited</span>
                                </span>
                              ) : (
                                <div className="space-y-1 min-w-[120px]">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span
                                      className={
                                        u.queryCount >= quotaLimit
                                          ? 'text-danger font-bold'
                                          : 'text-text-secondary'
                                      }
                                    >
                                      {u.queryCount} / {quotaLimit} queries
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingUserQuota(u);
                                        setCustomQuotaInput(quotaLimit);
                                      }}
                                      className="text-text-muted hover:text-accent ml-1"
                                      title="Edit user custom quota"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        u.queryCount >= quotaLimit ? 'bg-danger' : 'bg-accent'
                                      }`}
                                      style={{
                                        width: `${Math.min(100, Math.round((u.queryCount / quotaLimit) * 100))}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {u.status === 'PENDING' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 border border-amber-400/30 animate-pulse"
                              >
                                ⏳ Pending Approval
                              </span>
                            ) : (
                              <button
                                disabled={isSelf}
                                onClick={() =>
                                  updateUserStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold transition-colors ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                    : 'bg-danger/10 text-danger hover:bg-danger/20'
                                } ${isSelf ? 'cursor-default' : 'cursor-pointer'}`}
                                title={isSelf ? 'Cannot suspend self' : 'Toggle status'}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <>
                                    <UserCheck className="w-3 h-3" />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3" />
                                    <span>Suspended</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Admin Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Approve Button (for PENDING users) */}
                              {u.status === 'PENDING' && (
                                <button
                                  onClick={() => approveUser(u.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs transition-all"
                                  title="Grant Access"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Reset Usage Button */}
                              <button
                                onClick={() => resetUserQueries(u.id)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                                title="Reset query count to 0"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              {isSuperAdmin && !isSelf && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete user "${u.name}"?`)) {
                                      deleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RATE LIMITS & QUOTA CONFIGURATION */}
          {activeTab === 'limits' && (
            <div className="space-y-6 max-w-2xl">
              {/* Success Notification */}
              {limitsSavedToast && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-500 font-semibold animate-scale-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>AI limit configurations successfully updated and active immediately!</span>
                </div>
              )}

              {/* Reset All Notification */}
              {resetAllToast && (
                <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/30 flex items-center gap-2.5 text-xs text-accent-dark font-semibold animate-scale-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>All user & guest query counters have been reset to 0!</span>
                </div>
              )}

              <Card className="p-6 bg-surface border-border space-y-6">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    Global AI Rate Limit Configuration
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Set the query limits that trigger the ChatGPT-style registration dialog or limit notification.
                  </p>
                </div>

                <form onSubmit={handleSaveLimits} className="space-y-5">
                  {/* Guest Limit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-text-primary">
                        Guest Query Limit (Free Queries)
                      </label>
                      <span className="text-[11px] font-mono text-text-muted">
                        Currently: <strong>{systemLimits.guestLimit} queries</strong>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={guestLimitInput}
                      onChange={(e) => setGuestLimitInput(Number(e.target.value))}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                    />
                    <p className="text-[11px] text-text-muted">
                      Number of free queries an unauthenticated visitor gets before the ChatGPT-style signup modal appears.
                    </p>
                  </div>

                  {/* Registered User Daily Limit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-text-primary">
                        Student / User Daily Query Limit
                      </label>
                      <span className="text-[11px] font-mono text-text-muted">
                        Currently: <strong>{systemLimits.userDailyLimit} queries/day</strong>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={userLimitInput}
                      onChange={(e) => setUserLimitInput(Number(e.target.value))}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                    />
                    <p className="text-[11px] text-text-muted">
                      Default daily quota assigned to standard student and researcher accounts. (Super Admin & Admins remain unlimited).
                    </p>
                  </div>

                  {/* Enable Guest Access Toggle */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-text-primary block">
                        Allow Guest In-Browser Queries
                      </span>
                      <p className="text-[11px] text-text-muted">
                        If disabled, users must sign up or sign in immediately before entering any prompt.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableGuestInput}
                      onChange={(e) => setEnableGuestInput(e.target.checked)}
                      className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <Button type="submit" variant="primary" size="sm" className="rounded-xl gap-2 px-4 py-2 text-xs">
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Limit Configuration</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetAll}
                      className="rounded-xl gap-2 px-4 py-2 text-xs text-text-secondary hover:text-text-primary"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Query Counters</span>
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Information Notice */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2 text-xs text-text-secondary">
                <span className="font-semibold text-text-primary block">💡 How ChatGPT-Style Enforcement Works:</span>
                <p>
                  1. Visitors browse DatAI and can ask up to <strong>{systemLimits.guestLimit}</strong> free queries without an account.
                </p>
                <p>
                  2. Once reached, an elegant modal locks the query input and displays <em>"Create Free Account"</em>, <em>"Sign In"</em>, or <em>"⚡ Continue as Super Admin"</em>.
                </p>
                <p>
                  3. Super Admins (like you) always have unlimited queries across all workspaces.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM DIAGNOSTICS */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-4 bg-surface border-border space-y-1">
                  <span className="text-[11px] font-mono text-text-muted uppercase">FastAPI AI Gateway</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBackendConnected ? 'bg-emerald-500' : 'bg-danger'
                      }`}
                    />
                    <p className="text-base font-bold text-text-primary">
                      {isBackendConnected ? 'Online & Healthy' : 'Disconnected'}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">
                    Model: {geminiModel || 'gemini-flash-latest'}
                  </span>
                </Card>

                <Card className="p-4 bg-surface border-border space-y-1">
                  <span className="text-[11px] font-mono text-text-muted uppercase">Browser DuckDB Core</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    <p className="text-base font-bold text-text-primary">Active WASM Engine</p>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-medium">100% In-Browser SQL</span>
                </Card>

                <Card className="p-4 bg-surface border-border space-y-1">
                  <span className="text-[11px] font-mono text-text-muted uppercase">Guest Queries Used</span>
                  <p className="text-2xl font-bold text-text-primary font-mono">{guestQueryCount}</p>
                  <span className="text-[10px] text-accent font-medium">
                    Limit: {systemLimits.guestLimit} queries
                  </span>
                </Card>
              </div>

              {/* Super Admin: Global Gemini API Key Management */}
              {isSuperAdmin && (
                <Card className="p-5 bg-surface border-border space-y-3">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    Global Gemini API Key (Server-wide)
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    Set a global API key for the backend gateway. This key will be used for all users unless a user overrides it with their own key.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={globalApiKeyInput}
                      onChange={(e) => setGlobalApiKeyInput(e.target.value)}
                      placeholder="AIzaSy... (from Google AI Studio)"
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                    <select
                      value={globalModelInput}
                      onChange={(e) => setGlobalModelInput(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="gemini-flash-latest">gemini-flash-latest (Fast & Recommended)</option>
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast & Lightweight)</option>
                      <option value="gemini-3-flash-preview">gemini-3-flash-preview (Next-Gen Preview)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (High Intelligence)</option>
                    </select>
                  </div>

                  {apiKeyResult && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        apiKeyResult.success
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {apiKeyResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{apiKeyResult.message}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={apiKeyTesting || !globalApiKeyInput.trim()}
                    onClick={async () => {
                      setApiKeyTesting(true);
                      setApiKeyResult(null);
                      try {
                        const base = backendUrl || window.location.origin;
                        const cleaned = globalApiKeyInput
                          .trim()
                          .replace(/^["'`]|["'`]$/g, '')
                          .replace(/^(?:Bearer\s+|GEMINI_API_KEY\s*=\s*)/i, '')
                          .trim();
                        const res = await fetch(`${base}/api/chat/system-api-key`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ api_key: cleaned, model: globalModelInput }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setApiKeyResult({ success: data.status === 'ok', message: data.message || 'Global API key activated in .env!' });
                          // Also save to local settings so GeminiGatewayProvider sends it in X-Gemini-Key header
                          const { setApiKey, setGeminiModel, checkBackendHealth } = useSettingsStore.getState();
                          await setApiKey(cleaned);
                          await setGeminiModel(globalModelInput);
                          await checkBackendHealth();
                        } else {
                          setApiKeyResult({ success: false, message: data.detail || 'Failed to verify key.' });
                        }
                      } catch {
                        setApiKeyResult({ success: false, message: 'Cannot reach backend gateway.' });
                      } finally {
                        setApiKeyTesting(false);
                      }
                    }}
                    className="w-full rounded-xl text-xs font-bold"
                  >
                    {apiKeyTesting ? 'Verifying & Activating...' : 'Verify & Activate Global API Key'}
                  </Button>
                </Card>
              )}

              {/* Policy & Security Notice */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  College AI Security & Operational Policies
                </h4>
                <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>Super Admin Authority</strong>: You hold full access to user elevation, API key management, and system metrics.
                  </li>
                  <li>
                    <strong>Approval-Based Signup</strong>: New student registrations require Super Admin approval before they can access the workspace.
                  </li>
                  <li>
                    <strong>Zero-Trust Sandboxing</strong>: Each user's uploaded documents remain private to their local workspace.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-border bg-surface-elevated/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-text-muted font-mono">
            Logged in as: <strong className="text-text-primary">{currentUser.name}</strong> ({currentUser.email})
          </span>
          <Button variant="outline" size="sm" onClick={() => setAdminModalOpen(false)}>
            Close Console
          </Button>
        </div>
      </div>

      {/* SUB-MODAL: Add New User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowAddUserModal(false)}
          />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-modal p-6 z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-accent" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addUserError && (
              <div className="p-2.5 rounded-xl bg-danger-subtle border border-danger-border text-xs text-danger">
                {addUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex.m@college.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">College Department</label>
                <input
                  type="text"
                  placeholder="e.g. Dept. of Computer Science"
                  value={newUserInstitution}
                  onChange={(e) => setNewUserInstitution(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="USER">🎓 Student / User</option>
                    <option value="ADMIN">🛡️ Admin</option>
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Daily Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newUserRole === 'SUPER_ADMIN' ? 999999 : newUserLimit}
                    disabled={newUserRole === 'SUPER_ADMIN'}
                    onChange={(e) => setNewUserLimit(Number(e.target.value))}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Custom Quota */}
      {editingUserQuota && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditingUserQuota(null)}
          />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-modal p-6 z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5 text-accent" />
                <span>Override Quota for {editingUserQuota.name}</span>
              </h3>
              <button
                onClick={() => setEditingUserQuota(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-text-secondary">
                Max Daily Queries
              </label>
              <input
                type="number"
                min={1}
                max={999999}
                value={customQuotaInput}
                onChange={(e) => setCustomQuotaInput(Number(e.target.value))}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-text-muted">
                Standard system limit is {systemLimits.userDailyLimit} queries. You can grant elevated allowances to this specific account.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUserQuota(null)}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSaveCustomQuota}>
                Update Quota
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
