import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  message,
  ariaLabel,
  size = 'md',
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = cn(
    'flex items-center justify-center',
    fullScreen ? 'min-h-screen' : 'py-16',
    className
  );

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2
          className={cn(
            'animate-spin text-muted-foreground mx-auto',
            sizeClasses[size]
          )}
          role="status"
          {...(ariaLabel && { 'aria-label': ariaLabel })}
        />
        {message && (
          <p className="mt-4 text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
