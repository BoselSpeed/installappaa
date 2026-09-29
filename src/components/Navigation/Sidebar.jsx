import { useEffect, useState } from 'react';
import { useSectionsService } from '../../hooks/useSectionsService';
import { booksService } from '../../firebase/service';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../UI/Icon';
import { cn } from '../../utils/cn';

const UTILITY_LINKS = [
  { to: '/books', key: 'books', icon: 'books' },
  { to: '/statistics', key: 'stats', icon: 'chart' },
  { to: '/achievements', key: 'achievements', icon: 'trophy' },
  { to: '/settings', key: 'settings', icon: 'settings' },
];

const Sidebar = () => {
  const { sections, loading, error } = useSectionsService();
  const [books, setBooks] = useState([]);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    booksService
      .getAllBooks()
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch((err) => console.error('Error loading sidebar books:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const bookById = {};
  books.forEach((book) => {
    bookById[book.id] = book;
  });

  const sectionLink = (section) =>
    bookById[section.id] ? `/books/${section.id}` : `/sections/${section.id}`;

  const sectionTitle = (section) =>
    isRTL ? section.title_ar || section.title_en : section.title_en || section.title_ar;

  const isActive = (to) => location.pathname === to;

  const shell = 'hidden md:block w-64 shrink-0 border-e border-line bg-paper';

  if (loading) {
    return (
      <aside className={shell} aria-busy="true">
        <div className="space-y-2 p-4 lg:p-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={shell}>
        <div className="p-4 lg:p-5">
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            {t('error_occurred')}
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn(shell)}>
      <nav
        className="sticky top-[7.625rem] max-h-[calc(100vh-9rem)] overflow-y-auto p-4 lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:p-5"
        aria-label={t('sections')}
      >
        <ul className="space-y-1">
          {UTILITY_LINKS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-card duration-300',
                  isActive(item.to)
                    ? 'bg-ink text-white'
                    : 'text-ink-soft hover:bg-surface hover:text-ink'
                )}
              >
                <Icon name={item.icon} size="sm" />
                <span>{t(item.key)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 mb-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-muted">
          {t('sections')}
        </h2>
        <ul className="space-y-1">
          {sections
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => {
              const to = sectionLink(section);
              const active = location.pathname === to;
              return (
                <li key={section.id}>
                  <Link
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-card duration-300',
                      active ? 'bg-surface text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
                    )}
                  >
                    <Icon name="book" size="sm" className="text-ink-faint" />
                    <span className="truncate">{sectionTitle(section)}</span>
                  </Link>
                </li>
              );
            })}
          {sections.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-muted">{t('no_results')}</li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export { Sidebar };
