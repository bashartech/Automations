'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'span' | 'li';
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y, filter: reduce ? 'none' : 'blur(6px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };
  return (
    <Tag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      variants={variants}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  gap?: number;
  delayChildren?: number;
  staggerChildren?: number;
  once?: boolean;
};

export function Stagger({
  children,
  className,
  delayChildren = 0.05,
  staggerChildren = 0.08,
  once = true,
}: StaggerProps) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren: reduce ? 0 : staggerChildren,
      },
    },
  };
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.12 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AnimatedNumber({
  value,
  className,
  duration = 1.1,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(eased * value));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}
