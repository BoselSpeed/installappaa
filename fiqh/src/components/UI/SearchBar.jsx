import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchHistoryService } from '../../services/appService';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { cn } from '../../utils/cn';

const SearchBar = ({ placeholder, onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await searchHistoryService.getSearchHistory();
        setSuggestions(history.map((item) => item.query));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };
    loadHistory();
  }, []);

  const runSearch = (value) => {
    if (onSearch) {
      onSearch(value);
    } else {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    searchHistoryService.addSearch(value);
    setSuggestions((prev) => [value, ...prev.filter((s) => s !== value)].slice(0, 20));
    runSearch(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    runSearch(suggestion);
  };

  const handleClearHistory = async () => {
    try {
      await searchHistoryService.clearSearchHistory();
      setSuggestions([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError(t('voice_search_not_supported'));
      setTimeout(() => setVoiceError(''), 3000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = t('switch_to_arabic') === 'التغيير إلى العربية' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      runSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceError(t('voice_search_error'));
      setTimeout(() => setVoiceError(''), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const iconButton =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-card duration-300';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative" role="search">
        <Icon
          name="search"
          size="md"
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || t('search_placeholder')}
          aria-label={placeholder || t('search_placeholder')}
          className="w-full rounded-xl border border-line bg-paper py-3 pe-3 ps-12 text-base text-ink shadow-card transition-card duration-300 placeholder:text-ink-muted hover:border-ink-ghost focus:border-ink sm:text-base [&::-webkit-search-cancel-button]:appearance-none"
        />
        <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            type="button"
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            className={cn(
              iconButton,
              isListening
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-surface hover:text-ink'
            )}
            aria-label={t('voice_search')}
            title={t('voice_search')}
          >
            <Icon name="mic" size="md" />
          </button>
          <button
            type="submit"
            className={cn(iconButton, 'bg-ink text-white hover:bg-ink-soft')}
            aria-label={t('search_placeholder')}
            title={t('search_placeholder')}
          >
            <Icon name="arrowRight" size="md" className="rtl:rotate-180" />
          </button>
        </div>
      </form>

      {isListening && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-ink bg-ink px-4 py-3 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-white">
            <Icon name="mic" size="sm" />
            {t('voice_search_listening')}
          </p>
        </div>
      )}

      {voiceError && !isListening && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-line bg-paper px-4 py-3 text-center shadow-pop">
          <p className="text-sm text-ink-muted">{voiceError}</p>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isListening && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-paper shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t('recent_searches')}
            </span>
            <button
              type="button"
              onClick={handleClearHistory}
              className="min-h-[44px] rounded-lg px-3 text-xs font-medium text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink"
            >
              {t('clear_search_history')}
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2 text-start text-sm text-ink-body transition-colors duration-200 last:border-b-0 hover:bg-surface"
                >
                  <Icon name="history" size="sm" className="shrink-0 text-ink-faint" />
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && query.trim() && suggestions.length === 0 && !isListening && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-line bg-paper px-4 py-6 text-center shadow-pop">
          <p className="text-sm text-ink-muted">{t('no_results')}</p>
        </div>
      )}
    </div>
  );
};

export { SearchBar };
