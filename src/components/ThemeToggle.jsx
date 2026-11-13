import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-xl
        bg-brand-red-ink/10 text-brand-red-ink
        hover:bg-brand-red-ink/20 active:translate-y-px
        transition duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
        focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream ${className}`}
    >
      {isDark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
