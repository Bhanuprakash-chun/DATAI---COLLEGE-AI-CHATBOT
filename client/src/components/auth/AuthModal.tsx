import React, { useState } from 'react';
import {
  ShieldAlert,
  Crown,
  User as UserIcon,
  Mail,
  Lock,
  Building,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    openAuthModal,
    login,
    signup,
    loginAsSuperAdmin,
  } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingSuccessEmail, setPendingSuccessEmail] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await signup(name, email, password, institution);
        if (res.success) {
          if (res.pendingApproval) {
            setPendingSuccessEmail(email.trim());
          }
        } else {
          setErrorMessage(res.error || 'Signup failed');
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Login failed');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'super' | 'admin' | 'student') => {
    setErrorMessage('');
    if (type === 'super') {
      setEmail('admin@college.edu');
      setPassword('Bhanu@2006');
    } else if (type === 'admin') {
      setEmail('faculty@college.edu');
      setPassword('Admin@2026');
    } else {
      setEmail('student@college.edu');
      setPassword('Student@2026');
    }
  };

  const handleQuickSuperAdmin = async () => {
    setLoading(true);
    await loginAsSuperAdmin();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden z-10 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors z-20"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-border bg-surface-elevated/40 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-3 text-accent shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight font-sans">
            {pendingSuccessEmail
              ? 'Registration Received'
              : authMode === 'signup'
              ? 'Create Your College Account'
              : 'Sign In to DatAI'}
          </h2>
          <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
            {pendingSuccessEmail
              ? 'Institutional access control in effect.'
              : authMode === 'signup'
              ? 'Register with your college email. New accounts are submitted to Super Admin for access approval.'
              : 'Log in with your college credentials or test using demo accounts.'}
          </p>

          {!pendingSuccessEmail && (
            <div className="mt-3.5">
              <button
                type="button"
                onClick={handleQuickSuperAdmin}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-accent/20 via-accent/30 to-amber-500/20 hover:from-accent/30 hover:to-amber-500/30 text-accent-dark border border-accent/40 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Crown className="w-4 h-4 text-accent" />
                <span>⚡ 1-Click Login as Super Admin (Bhanu)</span>
              </button>
            </div>
          )}
        </div>

        {/* Pending Approval Success Screen */}
        {pendingSuccessEmail ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-text-primary">
                Awaiting Super Admin Approval
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                Account registered for <strong className="font-mono text-text-primary">{pendingSuccessEmail}</strong>.
                Your request has been forwarded to the Super Admin (<strong>admin@college.edu</strong>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 text-left space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Institutional Security Policy:
              </p>
              <p className="text-text-muted leading-normal">
                Once the Super Admin approves your registration in the Admin Console, you will be able to log in with your password.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setPendingSuccessEmail(null);
                openAuthModal('login');
              }}
              className="w-full rounded-xl text-xs font-bold"
            >
              Return to Sign In
            </Button>
          </div>
        ) : (
          <>
            {/* Auth Mode Tabs */}
            <div className="flex border-b border-border bg-surface-elevated/20 p-1.5 gap-1.5 mx-6 mt-4 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  openAuthModal('login');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-surface text-text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  openAuthModal('signup');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-surface text-text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            {/* Quick Demo Credentials Box in Sign In tab */}
            {authMode === 'login' && (
              <div className="mx-6 mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Demo Credentials:
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('super')}
                    className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-left truncate transition-colors"
                    title="Super Admin: admin@college.edu / Bhanu@2006"
                  >
                    <span className="font-bold block flex items-center gap-1">👑 Super Admin</span>
                    <span className="font-mono text-[9px] text-slate-500 block truncate">admin@college.edu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin')}
                    className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium text-left truncate transition-colors"
                    title="Faculty Admin: faculty@college.edu / Admin@2026"
                  >
                    <span className="font-bold block flex items-center gap-1">🛡️ Admin</span>
                    <span className="font-mono text-[9px] text-slate-500 block truncate">faculty@college.edu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('student')}
                    className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium text-left truncate transition-colors"
                    title="Student: student@college.edu / Student@2026"
                  >
                    <span className="font-bold block flex items-center gap-1">🎓 Student</span>
                    <span className="font-mono text-[9px] text-slate-500 block truncate">student@college.edu</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div
                className={`mx-6 mt-3 p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  errorMessage.includes('Pending')
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {errorMessage.includes('Pending') ? (
                  <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhanu Prakash"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-secondary">Password</label>
                  {authMode === 'login' && email.toLowerCase() === 'admin@college.edu' && (
                    <span className="text-[10px] text-amber-600 font-mono">Password: Bhanu@2006</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    College / Department (Optional)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Dept. of Computer Science & Engineering"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <p className="text-[10px] text-amber-700/80 mt-1.5 flex items-center gap-1 font-medium">
                    <Shield className="w-3 h-3 shrink-0" />
                    New signups require Super Admin approval before workspace access.
                  </p>
                </div>
              )}

              <div className="pt-1.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  className="w-full rounded-xl text-xs font-bold gap-2 py-2.5 shadow-subtle hover:scale-[1.01]"
                >
                  <span>{authMode === 'signup' ? 'Submit Registration for Approval' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Footer Helper */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-text-muted">
                  {authMode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="text-accent hover:underline font-semibold"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      New to College AI?{' '}
                      <button
                        type="button"
                        onClick={() => openAuthModal('signup')}
                        className="text-accent hover:underline font-semibold"
                      >
                        Create an Account
                      </button>
                    </>
                  )}
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
