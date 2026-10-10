import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { AIMode } from '@/types/settings';

export function OnboardingModal() {
  const { onboardingOpen, setOnboardingOpen, setCurrentView } = useUIStore();
  const { aiMode, setAiMode } = useSettingsStore();
  const [step, setStep] = useState(0);

  if (!onboardingOpen) return null;

  const screens = [
    {
      title: 'Your Files, Your Workspace',
      subtitle: 'Welcome to DatAI',
      description:
        'A purpose-built AI workspace designed to deeply understand your spreadsheets, documents, and data with verifiable evidence and zero hallucinated math.',
      icon: Sparkles,
    },
    {
      title: 'Files Stay On Your Device',
      subtitle: 'Browser-First Architecture',
      description:
        'When you upload files, they are processed and stored directly in your browser using IndexedDB and OPFS. We never dump entire files onto external cloud servers.',
      icon: ShieldCheck,
    },
    {
      title: 'Select Your AI Operating Mode',
      subtitle: 'Privacy & Control',
      description:
        'Choose how you want DatAI to operate. You can change this anytime from the top bar.',
      icon: Cpu,
      customContent: (
        <div className="grid grid-cols-1 gap-2 pt-2 text-left">
          {(['AUTO', 'ONLINE', 'OFFLINE'] as AIMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAiMode(mode)}
              className={`p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                aiMode === mode
                  ? 'bg-accent/15 border-accent text-text-primary font-semibold'
                  : 'bg-surface-elevated border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <div>
                <span className="font-mono text-text-primary">{mode}</span>
                <p className="text-[11px] text-text-muted font-normal mt-0.5">
                  {mode === 'AUTO' && 'Smart routing: local analytical queries + cloud qualitative reasoning.'}
                  {mode === 'ONLINE' && 'Gemini enabled with strict minimum-data context extraction.'}
                  {mode === 'OFFLINE' && '100% on device. Zero external cloud network calls.'}
                </p>
              </div>
              {aiMode === mode && <Check className="w-4 h-4 text-accent shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Upload Your First File',
      subtitle: 'Get Started',
      description:
        'Drag and drop an Excel sheet, CSV, PDF, or document into the workspace to start asking natural-language questions with citations.',
      icon: UploadCloud,
    },
  ];

  const currentScreen = screens[step];
  const Icon = currentScreen.icon;

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      setOnboardingOpen(false);
      setCurrentView('files');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-modal p-6 sm:p-8 space-y-6 text-center">
        {/* Step Indicator */}
        <div className="flex justify-center gap-1.5">
          {screens.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-8 bg-accent' : 'w-2 bg-border-strong'
              }`}
            />
          ))}
        </div>

        {/* Icon & Content */}
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-accent/40 flex items-center justify-center mx-auto text-accent shadow-xs">
          <Icon className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">
            {currentScreen.subtitle}
          </span>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">{currentScreen.title}</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            {currentScreen.description}
          </p>
        </div>

        {/* Custom Step Content if any */}
        {currentScreen.customContent}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="text-xs gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Button>

          <Button variant="accent" size="sm" onClick={handleNext} className="text-xs gap-1 px-4">
            {step === screens.length - 1 ? 'Go to Workspace' : 'Continue'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

