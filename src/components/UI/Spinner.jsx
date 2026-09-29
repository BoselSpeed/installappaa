import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-6 w-6 border-2',
  md: 'h-9 w-9 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

const Spinner = ({ size = 'md', className = '', label }) => (
  <div
    className={cn('flex flex-col items-center justify-center gap-4', className)}
    role="status"
    aria-live="polite"
  >
    <span
      className={cn(
        'animate-spin rounded-full border-ink border-t-transparent',
        SIZES[size] || SIZES.md
      )}
    />
    {label ? <span className="text-sm text-ink-muted">{label}</span> : <span className="sr-only">Loading</span>}
  </div>
);

// Full-page centred loading state.
const LoadingState = ({ label, className = '' }) => (
  <div className={cn('flex min-h-[50vh] items-center justify-center px-4 py-16', className)}>
    <Spinner size="lg" label={label} />
  </div>
);

export { Spinner, LoadingState };
