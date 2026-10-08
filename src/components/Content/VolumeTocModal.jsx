import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { resolveReadableVolumeUrl } from '../../services/volumeStorage';
import { getTocCache, saveTocCache } from '../../services/readerCache';
import { loadPdfDocument, extractOutline } from '../../lib/pdfOutline';
import { Spinner } from '../UI/Spinner';
import { Icon } from '../UI/Icon';
import { cn } from '../../utils/cn';

/**
 * Table-of-contents for a whole volume, shown before opening the reader.
 *
 * Reads the same PDF outline the reader does and shares its cache, so opening
 * the index and then the book parses the outline once. An entry jumps straight
 * to the reader on that page via ?page=N.
 */
const VolumeTocModal = ({ bookId, volume, onClose }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const navigate = useNavigate();
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const storageKey = `${bookId}--${volume.id}`;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const load = async () => {
      setLoading(true);
      setEntries(null);

      const cached = getTocCache(storageKey);
      if (cached) {
        setEntries(cached);
        setLoading(false);
        return;
      }

      try {
        const resolved = await resolveReadableVolumeUrl(bookId, volume.id, volume);
        if (!resolved) {
          if (!cancelled) setEntries([]);
          return;
        }
        objectUrl = resolved.revoke;

        const doc = await loadPdfDocument(resolved.url, storageKey);
        const extracted = await extractOutline(doc);
        saveTocCache(storageKey, extracted);
        if (!cancelled) setEntries(extracted);
      } catch (error) {
        console.error('Error extracting table of contents:', error);
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bookId, storageKey, volume]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const term = query.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) => entry.title.toLowerCase().includes(term));
  }, [entries, query]);

  const handleEntryClick = (page) => {
    navigate(`/books/${bookId}/volume/${volume.id}?page=${page}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={t('toc')}
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label={t('close')}
      />
      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-line bg-paper shadow-card sm:m-4 sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-ink">{t('toc')}</h3>
            <p className="truncate text-xs text-ink-muted">
              {pick(volume, 'title') || t('volume')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label={t('close')}
            title={t('close')}
          >
            <Icon name="close" size="md" />
          </button>
        </div>

        {entries && entries.length > 0 && (
          <div className="border-b border-line px-3 py-2 sm:px-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('toc_filter')}
              className="w-full rounded-xl border border-line bg-surface-quiet px-3 py-2 text-sm text-ink transition-card duration-300 focus:border-ink"
              aria-label={t('toc_filter')}
              autoFocus
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Spinner size="md" />
              <p className="text-center text-xs text-ink-muted">{t('toc_extracting')}</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="space-y-0.5">
              {filtered.map((entry, index) => (
                <li key={`${entry.page}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleEntryClick(entry.page)}
                    style={{ paddingInlineStart: `${0.75 + (entry.level - 1) * 0.875}rem` }}
                    className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm text-ink-body transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0 truncate">{entry.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                      {entry.page}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && entries && entries.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-muted">
              {t('toc_unavailable')}
            </div>
          )}

          {!loading && entries && entries.length > 0 && filtered.length === 0 && (
            <div className={cn('px-4 py-8 text-center text-sm text-ink-muted')}>
              {t('no_results')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { VolumeTocModal };
