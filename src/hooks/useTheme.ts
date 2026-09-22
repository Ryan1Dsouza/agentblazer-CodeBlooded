import { useState, useEffect } from 'react';
import { Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('agentblazer-theme');
    return (saved as Theme) || 'violet';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const switchTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return { theme, switchTheme };
}
