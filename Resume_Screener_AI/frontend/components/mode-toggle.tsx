'use client';

import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
      className="relative overflow-hidden rounded-full text-muted-foreground hover:text-foreground"
    >
      <motion.span
        key={theme === 'dark' ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="absolute"
      >
        {theme === 'dark' ? (
          <Moon className="h-[1.15rem] w-[1.15rem]" />
        ) : (
          <Sun className="h-[1.15rem] w-[1.15rem]" />
        )}
      </motion.span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
