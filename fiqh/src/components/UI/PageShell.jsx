import { cn } from '../../utils/cn';

// Consistent horizontal rhythm for every page: 16px screen padding on phones,
// scaling to 32px on desktop, with vertical breathing room between blocks.
const WIDTHS = {
  narrow: 'max-w-3xl',
  reading: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

const PageShell = ({ width = 'default', className = '', children, ...rest }) => (
  <div
    className={cn('page-container', WIDTHS[width] || WIDTHS.default, className)}
    {...rest}
  >
    {children}
  </div>
);

export { PageShell };
