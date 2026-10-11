import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { cn } from '../../utils/cn';

// Back link used at the top of detail pages.
const BackLink = ({ to, children, className = '', icon = true }) => (
  <Link
    to={to}
    className={cn(
      'group inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink',
      className
    )}
  >
    {icon && (
      <Icon
        name="arrowRight"
        size="sm"
        className="rtl:rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
      />
    )}
    {children}
  </Link>
);

export { BackLink };
