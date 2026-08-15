import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isVolumeStored,
  downloadVolume,
  removeStoredVolume
} from '../services/volumeStorage';

const initialState = (volume) => ({
  id: volume.id,
  bundled: Boolean(volume.bundled),
  downloaded: false,
  downloading: false,
  progress: 0,
  error: null
});

// Tracks the on-device availability of every volume of a book:
//   - bundled volumes ship with the app and are always available;
//   - the others start as "not downloaded" and move through
//     downloading -> downloaded, and can be removed again.
export const useVolumeDownloads = (book) => {
  const [states, setStates] = useState({});
  const bookRef = useRef(book);
  bookRef.current = book;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const current = bookRef.current;
      if (!current || !current.volumes) return;

      const next = {};
      for (const volume of current.volumes) {
        next[volume.id] = initialState(volume);
        if (!volume.bundled) {
          const stored = await isVolumeStored(current.id, volume.id);
          if (cancelled) return;
          next[volume.id] = { ...next[volume.id], downloaded: stored };
        }
      }
      if (!cancelled) setStates(next);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [book?.id]);

  const updateVolume = useCallback((volumeId, patch) => {
    setStates((prev) => {
      const current = prev[volumeId];
      return current ? { ...prev, [volumeId]: { ...current, ...patch } } : prev;
    });
  }, []);

  const download = useCallback(
    async (volume) => {
      const current = bookRef.current;
      if (!current) return;
      updateVolume(volume.id, { downloading: true, progress: 0, error: null });
      try {
        await downloadVolume(current, volume, (progress) => {
          updateVolume(volume.id, { progress });
        });
        updateVolume(volume.id, {
          downloading: false,
          progress: 100,
          downloaded: true
        });
      } catch (error) {
        console.error('Error downloading volume:', error);
        updateVolume(volume.id, {
          downloading: false,
          downloaded: false,
          error: error.message || 'download_error'
        });
      }
    },
    [updateVolume]
  );

  const remove = useCallback(
    async (volume) => {
      const current = bookRef.current;
      if (!current || volume.bundled) return;
      try {
        await removeStoredVolume(current.id, volume.id);
        updateVolume(volume.id, {
          downloaded: false,
          downloading: false,
          progress: 0,
          error: null
        });
      } catch (error) {
        console.error('Error removing volume:', error);
      }
    },
    [updateVolume]
  );

  const getState = useCallback(
    (volume) => states[volume.id] || initialState(volume),
    [states]
  );

  return { states, getState, download, remove };
};
