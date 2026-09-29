import { cn } from '../../utils/cn';

const VARIANTS = {
  solid: 'bg-ink text-white border border-ink',
  outline: 'bg-paper text-ink border border-ink',
  muted: 'bg-surface text-ink-muted border border-line',
  filled: 'bg-ink-soft text-white border border-ink-soft',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[0.6875rem] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-1.5',
};

const Badge = ({ variant = 'muted', size = 'md', icon, className = '', children, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full font-medium leading-5 whitespace-nowrap',
      VARIANTS[variant] || VARIANTS.muted,
      SIZES[size] || SIZES.md,
      className
    )}
    {...rest}
  >
    {icon}
    {children}
  </span>
);

export { Badge };
