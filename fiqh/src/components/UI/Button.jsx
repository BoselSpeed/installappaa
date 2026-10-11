import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

// Black/white button system.
// - primary: solid black surface, white label
// - secondary: black outline, ink label
// - subtle: light grey surface, no strong outline
// - ghost: text-only, grey hover surface
// All sizes keep a 44px minimum touch target.
const VARIANTS = {
  primary:
    'bg-ink text-white border border-ink hover:bg-ink-soft hover:border-ink-soft active:bg-ink',
  secondary:
    'bg-paper text-ink border border-ink hover:bg-surface active:bg-line',
  subtle:
    'bg-surface text-ink border border-line hover:bg-line',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-surface hover:text-ink',
};

const SIZES = {
  sm: 'min-h-[44px] px-3 py-2 text-sm gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-sm sm:text-base gap-2',
  lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-xl font-medium text-center ' +
  'transition-card duration-300 disabled:opacity-40 disabled:pointer-events-none select-none';

export const buttonClass = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  cn(BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, className);

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  to,
  href,
  icon,
  children,
  type = 'button',
  ...rest
}) => {
  const classes = buttonClass({ variant, size, className });
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
};

export { Button };
