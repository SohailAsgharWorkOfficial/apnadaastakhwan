import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ className = '', variant = 'light' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const tones =
    variant === 'dark'
      ? 'bg-white/10 text-brand-ivory/80 hover:bg-white/20 hover:text-brand-mustard'
      : 'bg-brand-red-ink/10 text-brand-red-ink hover:bg-brand-red-ink/20';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-xl
        ${tones} active:translate-y-px transition duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard
        focus-visible:ring-offset-2 focus-visible:ring-offset-brand-charcoal ${className}`}
    >
      {isDark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
