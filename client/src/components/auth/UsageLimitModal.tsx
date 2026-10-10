import React from 'react';
import {
  Sparkles,
  Lock,
  ArrowRight,
  Crown,
  LogIn,
  UserPlus,
  X,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function UsageLimitModal() {
  const {
    isLimitModalOpen,
    closeLimitModal,
    limitModalReason,
    currentUser,
    systemLimits,
    guestQueryCount,
    openAuthModal,
    loginAsSuperAdmin,
  } = useAuthStore();

  if (!isLimitModalOpen) return null;

  const isGuest = !currentUser;
  const isSuspended = currentUser?.status === 'SUSPENDED';

  const currentCount = isGuest ? guestQueryCount : currentUser?.queryCount || 0;
  const maxLimit = isGuest
    ? systemLimits.guestLimit
    : currentUser?.queryLimit ?? systemLimits.userDailyLimit;

  const handleOpenSignup = () => {
    closeLimitModal();
    openAuthModal('signup');
  };

  const handleOpenLogin = () => {
    closeLimitModal();
    openAuthModal('login');
  };

  const handleSuperAdminBypass = async () => {
    await loginAsSuperAdmin();
    closeLimitModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={closeLimitModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden z-10 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={closeLimitModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors z-20"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Visual Banner */}
        <div className="p-6 pb-5 border-b border-border bg-gradient-to-b from-accent/15 via-surface-elevated/40 to-surface text-center">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-md">
              {isSuspended ? (
                <Lock className="w-7 h-7 text-danger" />
              ) : (
                <Zap className="w-7 h-7 text-accent" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-dark border border-accent/30 text-[11px] font-mono font-semibold mb-2">
            <span>
              {isSuspended
                ? 'Account Suspended'
                : isGuest
                ? 'Sign In or Sign Up Required'
                : 'Daily Limit Reached'}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-text-primary tracking-tight font-sans">
            {isSuspended
              ? 'Access Suspended by Admin'
              : isGuest
              ? 'Sign In Required to Use AI'
              : 'Daily Query Limit Reached'}
          </h2>

          <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
            {isSuspended
              ? 'Your account has been temporarily restricted. Please contact your college Super Administrator.'
              : isGuest
              ? 'DatAI requires an authenticated student, faculty, or admin account to use the AI chatbot and analyze files. Sign in or register to get started.'
              : `You've used ${currentCount} of ${maxLimit} AI queries today. Your quota resets at midnight or can be upgraded by your Super Admin.`}
          </p>
        </div>

        {/* Usage Progress Meter */}
        <div className="px-6 py-4 bg-surface-elevated/30 border-b border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <span>Usage Status</span>
            </span>
            <span className="font-mono text-text-muted text-[11px]">
              {currentCount} / {maxLimit} queries used (100%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border">
            <div className="h-full bg-accent rounded-full w-full transition-all duration-500" />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="p-6 pt-4 space-y-3">
          <div className="rounded-xl bg-surface-elevated p-3 border border-border space-y-2">
            <span className="text-[11px] font-mono text-text-muted uppercase font-semibold block">
              Free Account Benefits
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>25 Daily AI Queries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Unlimited Local DuckDB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Full Chat History</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Private & Sandboxed</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            {isGuest ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenSignup}
                  className="w-full rounded-xl text-xs font-bold gap-2 py-2.5 shadow-subtle hover:scale-[1.01]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account to Continue</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleOpenLogin}
                  className="w-full rounded-xl text-xs font-semibold gap-2 py-2.5"
                >
                  <LogIn className="w-4 h-4 text-text-muted" />
                  <span>Already have an account? Sign In</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={closeLimitModal}
                className="w-full rounded-xl text-xs font-semibold py-2.5"
              >
                Close & Review Previous Answers
              </Button>
            )}

            {/* Quick Super Admin Bypass Option */}
            <div className="pt-2 border-t border-border mt-3 text-center">
              <button
                type="button"
                onClick={handleSuperAdminBypass}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-accent/15 via-accent/25 to-amber-500/15 hover:from-accent/25 hover:to-amber-500/25 text-accent-dark border border-accent/30 shadow-2xs transition-all hover:scale-[1.01]"
              >
                <Crown className="w-4 h-4 text-accent" />
                <span>⚡ Continue as Super Admin (Unlimited Access)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
