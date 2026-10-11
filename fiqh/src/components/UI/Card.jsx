import { cn } from '../../utils/cn';

// Pure white card with a hairline grey border and a soft, low-opacity shadow.
const Card = ({ as: Tag = 'div', interactive = false, className = '', children, ...rest }) => (
  <Tag
    className={cn(
      'rounded-2xl border border-line bg-paper shadow-card',
      interactive &&
        'transition-card duration-300 hover:border-ink-ghost hover:shadow-card-hover focus-visible:border-ink',
      className
    )}
    {...rest}
  >
    {children}
  </Tag>
);

export { Card };
