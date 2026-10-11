import { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Icon } from './UI/Icon';
import { buttonClass } from './UI/Button';

// Last line of defence: catches render/lifecycle errors anywhere below it so a
// single broken page or component shows a recoverable message instead of a
// blank white screen.
//
// Deliberately dependency-light — no router links and no context hooks — so a
// crash originating inside the router, i18n, or a provider cannot throw again
// while the fallback is rendering.
class ErrorBoundaryBase extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  handleRetry() {
    this.setState({ error: null });
    if (this.props.resetOnRetry !== false) {
      window.location.reload();
    }
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return typeof fallback === 'function' ? fallback(error, this.handleRetry) : fallback;

    const { t } = this.props;
    const detail = error?.message && import.meta.env?.DEV ? error.message : null;

    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
            <Icon name="info" size="lg" />
          </span>

          <h1 className="mt-6 text-xl font-bold text-ink">{t('error_boundary_title')}</h1>
          <p className="mt-3 text-sm text-ink-muted">{t('error_boundary_hint')}</p>

          {detail && (
            <pre className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface p-3 text-left text-xs text-ink-body">
              {detail}
            </pre>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className={buttonClass({ variant: 'primary' })} onClick={this.handleRetry}>
              <Icon name="history" size="sm" />
              {t('try_again')}
            </button>
            <a href="/" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
              {t('go_home')}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

const ErrorBoundary = withTranslation()(ErrorBoundaryBase);

export { ErrorBoundary, ErrorBoundaryBase };
export default ErrorBoundary;
