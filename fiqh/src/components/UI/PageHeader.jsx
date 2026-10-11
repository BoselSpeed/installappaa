import { cn } from '../../utils/cn';

// Page-level heading block. Sizes scale with the viewport:
// phones 20-24px, tablets 24-32px, desktop up to 36px.
const PageHeader = ({ title, description, actions, className = '', children }) => (
  <header className={cn('mb-6 sm:mb-8 lg:mb-10', className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.5rem] sm:text-3xl lg:text-4xl font-bold text-ink">{title}</h1>
        {description && (
          <p className="mt-2 sm:mt-3 max-w-prose text-sm sm:text-base text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
    {children}
  </header>
);

const SectionTitle = ({ as: Tag = 'h2', className = '', children, ...rest }) => (
  <Tag
    className={cn('text-lg sm:text-xl lg:text-2xl font-bold text-ink', className)}
    {...rest}
  >
    {children}
  </Tag>
);

export { PageHeader, SectionTitle };
