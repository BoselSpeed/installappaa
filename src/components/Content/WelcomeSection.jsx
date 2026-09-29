import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Icon } from '../UI/Icon';

const WelcomeSection = ({ title, description, ctaText, ctaUrl, secondaryText, secondaryUrl }) => (
  <Card className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full border border-line"
    />
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -end-2 -top-2 h-24 w-24 rounded-full border border-line"
    />

    <div className="relative max-w-2xl">
      <h1 className="text-[1.5rem] font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      <p className="mt-4 mb-7 max-w-prose text-sm leading-relaxed text-ink-muted sm:text-base lg:mt-5 lg:mb-8 lg:text-lg">
        {description}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button to={ctaUrl} size="lg">
          <Icon name="book" size="sm" />
          {ctaText}
        </Button>
        {secondaryText && secondaryUrl && (
          <Button to={secondaryUrl} variant="secondary" size="lg">
            <Icon name="grid" size="sm" />
            {secondaryText}
          </Button>
        )}
      </div>
    </div>
  </Card>
);

export { WelcomeSection };
