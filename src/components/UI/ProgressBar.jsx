import { cn } from '../../utils/cn';

// Monochrome progress track — light grey rail, solid black fill.
const ProgressBar = ({ value = 0, className = '', size = 'md', label, ...rest }) => {
  const safe = Math.min(Math.max(Number(value) || 0, 0), 100);
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-line', heights[size] || heights.md, className)}
      {...rest}
    >
      <div
        className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
};

export { ProgressBar };
