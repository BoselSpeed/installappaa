import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { resolveVolumeUrl } from '../../services/supabaseStorage';

const VolumeCard = ({ book, volume, state, onDownload, onDelete }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const title = pick(volume, 'title') || `${t('volume')} ${volume.number || ''}`.trim();
  const sizeMb = volume.sizeMb;

  const statusRow = () => {
    if (state.bundled) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-black">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black text-white text-xs">✓</span>
          {t('bundled_with_app')}
        </span>
      );
    }
    if (state.downloading) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-black">
          <span className="flex items-center justify-center h-5 w-5 rounded-full border border-black text-xs">…</span>
          {t('downloading')}
        </span>
      );
    }
    if (state.downloaded) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-black">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black text-white text-xs">✓</span>
          {t('available_offline')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
        <span className="flex items-center justify-center h-5 w-5 rounded-full border border-gray-400 text-xs">↓</span>
        {t('not_downloaded')}
      </span>
    );
  };

  const renderActions = () => {
    if (state.bundled || state.downloaded) {
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            to={`/books/${book.id}/volume/${volume.id}`}
            className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {t('open_pdf')}
          </Link>
          {!state.bundled &&
            (confirmDelete ? (
              <span className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onDelete?.(volume);
                    setConfirmDelete(false);
                  }}
                  className="px-4 py-2 bg-white text-black border border-black rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('confirm_delete')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:underline"
                >
                  {t('cancel')}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 bg-white text-black border border-black rounded text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t('delete_from_device')}
              </button>
            ))}
        </div>
      );
    }

    if (state.downloading) {
      return (
        <div className="w-full">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>{t('downloading')}</span>
            <span>{state.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-150"
              style={{ width: `${state.progress}%` }}
            ></div>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => onDownload?.(volume)}
        className="px-4 py-2 bg-white text-black border border-black rounded text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        {t('download')}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-black p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <h3 className="text-lg font-semibold text-black">{title}</h3>
            <p className="text-sm text-gray-500">
              {sizeMb != null && sizeMb > 0 ? `PDF • ${sizeMb} MB` : 'PDF'}
            </p>
          </div>
        </div>
        <div className="shrink-0">{statusRow()}</div>
      </div>

      {state.error && (
        <div className="text-sm text-black bg-gray-50 border border-gray-200 rounded px-3 py-2 space-y-2">
          <p>{state.error === 'download_error' ? t('download_error') : state.error}</p>
          {resolveVolumeUrl(volume, book) && (
            <a
              href={resolveVolumeUrl(volume, book)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1.5 bg-white text-black border border-black rounded text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              {t('open_in_browser')}
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center mt-auto pt-1">{renderActions()}</div>
    </div>
  );
};

export { VolumeCard };
