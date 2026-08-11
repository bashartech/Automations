import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
