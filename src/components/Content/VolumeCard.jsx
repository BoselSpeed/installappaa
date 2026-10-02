import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { canReadInApp, resolveVolumeUrl } from '../../services/volumeStorage';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { ProgressBar } from '../UI/ProgressBar';
import { Icon } from '../UI/Icon';
import { cn } from '../../utils/cn';

const StatusMark = ({ tone, icon, label }) => (
  <span
    className={cn(
      'flex flex-col items-end gap-1 text-xs font-medium',
      tone === 'solid' ? 'text-ink' : 'text-ink-muted'
    )}
  >
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        tone === 'solid' ? 'bg-ink text-white' : 'border border-ink-ghost text-ink-muted'
      )}
    >
      <Icon name={icon} size="xs" strokeWidth={tone === 'solid' ? 2.5 : 1.5} />
    </span>
    {label}
  </span>
);

const VolumeCard = ({ book, volume, state, onDownload, onDelete }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const title = pick(volume, 'title') || `${t('volume')} ${volume.number || ''}`.trim();
  const sizeMb = volume.sizeMb;
  // Only a bundled PDF ships with the app, so only a bundled PDF can be opened
  // in the reader. Anything else has to be opened where it is hosted.
  const readableInApp = canReadInApp(volume);
  const externalUrl = resolveVolumeUrl(volume, book);
  const statusRow = () => {
    if (state.bundled) {
      return <StatusMark tone="solid" icon="check" label={t('bundled_with_app')} />;
    }
    if (state.downloading) {
      return <StatusMark tone="muted" icon="download" label={t('downloading')} />;
    }
    if (state.downloaded) {
      return <StatusMark tone="solid" icon="check" label={t('available_offline')} />;
    }
    if (!readableInApp) {
      return <StatusMark tone="muted" icon="arrowUpRight" label={t('opens_in_browser')} />;
    }
    return <StatusMark tone="muted" icon="download" label={t('not_downloaded')} />;
  };

  // A volume whose host sends no CORS headers can never be fetched by a static
  // site, so the card offers its original location instead of a download button
  // that could only ever fail.
  const errorBlock = () => {
    if (!readableInApp && externalUrl) {
      return (
        <div className="space-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <p className="flex items-start gap-2">
            <Icon name="info" size="sm" className="mt-0.5 shrink-0 text-ink-muted" />
            <span>{t('external_volume_hint')}</span>
          </p>
          <div className="ps-7">
            <Button href={externalUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="secondary">
              <Icon name="arrowUpRight" size="sm" />
              {t('open_in_browser')}
            </Button>
          </div>
        </div>
      );
    }

    if (!state.error) return null;

    const message = state.error === 'download_blocked' ? t('download_blocked') : state.error === 'download_error' ? t('download_error') : state.error;
    const hint = state.error === 'download_blocked' ? t('download_blocked_hint') : t('download_retry_hint');

    return (
      <div className="space-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
        <p className="flex items-start gap-2">
          <Icon name="info" size="sm" className="mt-0.5 shrink-0 text-ink-muted" />
          <span>{message}</span>
        </p>
        <p className="ps-7 text-xs text-ink-muted">{hint}</p>
        {externalUrl && (
          <div className="ps-7">
            <Button href={externalUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="secondary">
              <Icon name="arrowUpRight" size="sm" />
              {t('open_in_browser')}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (state.bundled || state.downloaded) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button to={`/books/${book.id}/volume/${volume.id}`} size="sm">
            <Icon name="file" size="sm" />
            {t('open_pdf')}
          </Button>
          {!state.bundled &&
            (confirmDelete ? (
              <span className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onDelete?.(volume);
                    setConfirmDelete(false);
                  }}
                >
                  <Icon name="trash" size="sm" />
                  {t('confirm_delete')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t('cancel')}
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size="sm" />
                {t('delete_from_device')}
              </Button>
            ))}
        </div>
      );
    }

    if (state.downloading) {
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
            <span>{t('downloading')}</span>
            <span className="tabular-nums">{state.progress}%</span>
          </div>
          <ProgressBar value={state.progress} label={t('downloading')} size="sm" />
        </div>
      );
    }

    return (
      <Button size="sm" variant="secondary" onClick={() => onDownload?.(volume)}>
        <Icon name="download" size="sm" />
        {t('download')}
      </Button>
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-5 transition-card duration-300 hover:shadow-card-hover sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted">
            <Icon name="book" size="md" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug text-ink sm:text-lg">{title}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              {sizeMb != null && sizeMb > 0 ? `PDF • ${sizeMb} MB` : 'PDF'}
            </p>
          </div>
        </div>
        <div className="shrink-0">{statusRow()}</div>
      </div>

      {errorBlock()}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">{renderActions()}</div>
    </Card>
  );
};

export { VolumeCard };
