'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
});

function Sheet({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <SheetContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, asChild, className, ...props }: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <button className={className} onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  );
}

function SheetContent({ children, className, side = 'left' }: {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
}) {
  const { open, onOpenChange } = React.useContext(SheetContext);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        className={cn(
          'fixed top-0 z-50 h-full w-72 bg-background border-r shadow-lg transition-transform duration-300',
          side === 'left' && 'left-0',
          side === 'right' && 'right-0',
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
          className,
        )}
      >
        <div className="flex h-full flex-col">{children}</div>
      </div>
    </>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-4 border-b', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
