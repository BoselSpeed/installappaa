import { Icon } from './Icon';
import { cn } from '../../utils/cn';

// Calm, monochrome empty state: thin line icon, muted helper text.
const EmptyState = ({ icon = 'inbox', title, description, action, className = '' }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper px-6 py-14 text-center sm:py-20',
      className
    )}
  >
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
      <Icon name={icon} size="lg" />
    </span>
    {title && <p className="mt-5 text-lg font-semibold text-ink-soft">{title}</p>}
    {description && <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export { EmptyState };
