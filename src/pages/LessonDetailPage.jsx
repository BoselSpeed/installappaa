import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsService, lessonContentService, notesService } from '../firebase/service';
import { useUserProgress } from '../hooks/useUserProgress';
import { useNotes } from '../hooks/useNotes';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { SectionTitle } from '../components/UI/PageHeader';
import { BackLink } from '../components/UI/BackLink';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { Spinner } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';
import { cn } from '../utils/cn';

const PDFReader = lazy(() =>
  import('../components/Content/PDFReader').then((m) => ({ default: m.PDFReader }))
);

const fontSizeClass = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg'
};

const LessonDetailPage = () => {
  const { sectionId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { markLessonCompleted, addBookmark, removeBookmark, progress, updateReadingStats, checkDailyGoal } = useUserProgress();
  const { loadNotesForLesson, addNote, updateNote, deleteNote } = useNotes();
  const { settings } = useAppSettings();
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteType, setNoteType] = useState('note');
  const contentRef = useRef(null);
  const readingStartRef = useRef(null);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      try {
        const [lessonData, contentData, sectionLessons] = await Promise.all([
          lessonsService.getLessonById(lessonId),
          lessonContentService.getLessonContent(lessonId),
          lessonsService.getLessonsBySection(sectionId)
        ]);

        setLesson(lessonData);
        setContent(contentData);
        setSiblings(sectionLessons);

        if (progress) {
          setIsCompleted(progress.completedLessons?.includes(lessonId));
          setIsBookmarked(progress.bookmarkedLessons?.includes(lessonId));
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
    setReadingProgress(0);
  }, [lessonId, sectionId, progress]);

  useEffect(() => {
    if (lessonId) {
      loadNotesForLesson(lessonId);
    }
  }, [lessonId, loadNotesForLesson]);

  useEffect(() => {
    const handler = setInterval(() => {
      if (readingStartRef.current) {
        const elapsed = Math.floor((Date.now() - readingStartRef.current) / 60000);
        if (elapsed > 0) {
          updateReadingStats(elapsed);
          readingStartRef.current = Date.now();
        }
      }
    }, 60000);
    return () => clearInterval(handler);
  }, [updateReadingStats]);

  useEffect(() => {
    readingStartRef.current = Date.now();
    return () => {
      if (readingStartRef.current) {
        const elapsed = Math.floor((Date.now() - readingStartRef.current) / 60000);
        if (elapsed > 0) {
          updateReadingStats(elapsed);
        }
      }
    };
  }, [lessonId, updateReadingStats]);

  useEffect(() => {
    if (isCompleted) {
      checkDailyGoal();
    }
  }, [isCompleted, checkDailyGoal]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const value = max > 0 ? (el.scrollTop / max) * 100 : 0;
    setReadingProgress(Math.round(value));
  }, []);

  const handleToggleComplete = async () => {
    try {
      if (isCompleted) {
        setIsCompleted(false);
      } else {
        await markLessonCompleted(lessonId);
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark(lessonId);
        setIsBookmarked(false);
      } else {
        await addBookmark(lessonId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handlePdfPageChange = useCallback((page, totalPages) => {
    const value = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;
    setReadingProgress(value);
  }, []);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote(lessonId, noteText.trim(), noteType);
      setNoteText('');
      setNoteType('note');
      const updated = await notesService.getNotesByLesson(lessonId);
      setNotes(updated);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async (noteId, text) => {
    try {
      await updateNote(lessonId, noteId, text);
      setEditingNoteId(null);
      const updated = await notesService.getNotesByLesson(lessonId);
      setNotes(updated);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(lessonId, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label={t('loading')} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-ink-muted">{t('error_occurred')}</p>
      </div>
    );
  }

  const currentIndex = siblings.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 key={index} className="mt-8 mb-4 text-lg font-bold text-ink sm:text-xl first:mt-0">
            {pick(block, 'content')}
          </h2>
        );
      case 'paragraph':
        return (
          <p key={index} className="mb-6 leading-relaxed text-ink-body last:mb-0">
            {pick(block, 'content')}
          </p>
        );
      case 'note':
        return (
          <div
            key={index}
            className="mb-6 rounded-xl border-s-4 border-ink bg-surface-quiet p-4 leading-relaxed text-ink-body rtl:border-s-0 rtl:border-e-4"
          >
            <p>{pick(block, 'content')}</p>
          </div>
        );
      case 'list':
        return (
          <ul key={index} className="mb-6 list-disc space-y-2 ps-5 last:mb-0">
            {(pick(block, 'content') || '').split('\n').map((item, i) => (
              <li key={i} className="leading-relaxed text-ink-body">{item}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  const hasContent = Boolean(content?.blocks?.length);

  return (
    <PageShell width="reading">
      <BackLink to={`/sections/${sectionId}`} className="mb-4">
        {t('previous')} · {t('browse_sections')}
      </BackLink>

      <header className="mb-6 mt-4 sm:mb-8">
        <h1 className="text-[1.5rem] font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
          {pick(lesson, 'title')}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="solid">{lesson.level ? t(lesson.level) : t('beginner')}</Badge>
        </div>
      </header>

      <div className="sticky top-[7.625rem] z-30 lg:top-16 mb-6 rounded-xl border border-line bg-paper/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>{t('reading_progress')}</span>
          <span className="tabular-nums font-medium text-ink">{readingProgress}%</span>
        </div>
        <ProgressBar value={readingProgress} size="sm" label={t('reading_progress')} />
      </div>

      {lesson.pdfUrl ? (
        <div className={fontSizeClass[settings?.fontSize] || 'text-base'}>
          <Suspense
            fallback={
              <Card className="flex flex-col items-center justify-center gap-4 py-24">
                <Spinner size="lg" />
                <p className="text-sm text-ink-muted">{t('pdf_loading')}</p>
              </Card>
            }
          >
            <PDFReader
              pdfUrl={lesson.pdfUrl}
              fileName={`${lesson.id}.pdf`}
              onPageChange={handlePdfPageChange}
            />
          </Suspense>
          {lesson.pages > 0 && (
            <p className="mt-4 text-center text-sm text-ink-muted">
              {t('of_pages', { count: lesson.pages })}
            </p>
          )}
        </div>
      ) : hasContent ? (
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className={cn('max-h-[65vh] overflow-y-auto pe-1', fontSizeClass[settings?.fontSize] || 'text-base')}
        >
          <div className="max-w-prose">{content.blocks.map(renderBlock)}</div>
        </div>
      ) : (
        <Card className="px-6 py-14 text-center">
          <p className="text-sm text-ink-muted">{t('no_results')}</p>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-8 sm:mt-10">
        <Button
          onClick={handleToggleComplete}
          variant={isCompleted ? 'primary' : 'secondary'}
          icon={isCompleted ? <Icon name="check" size="sm" strokeWidth={2.5} /> : <Icon name="checkCircle" size="sm" />}
        >
          {isCompleted ? t('completed') : t('mark_complete')}
        </Button>

        <Button
          onClick={handleToggleBookmark}
          variant={isBookmarked ? 'primary' : 'secondary'}
          icon={<Icon name={isBookmarked ? 'bookmarkFilled' : 'bookmark'} size="sm" />}
        >
          {isBookmarked ? t('bookmarked') : t('bookmark')}
        </Button>

        <Button to={`/quiz/${lessonId}`} variant="secondary" icon={<Icon name="quiz" size="sm" />}>
          {t('quiz')}
        </Button>
      </div>

      <div className="mt-12 border-t border-line pt-8 sm:mt-14 sm:pt-10">
        <SectionTitle className="mb-5 flex items-center gap-2 sm:mb-6">
          <Icon name="note" size="sm" className="text-ink-faint" />
          {t('notes')}
        </SectionTitle>

        <Card className="mb-5 p-4 sm:p-5">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('note_text_placeholder')}
            aria-label={t('note_text_placeholder')}
            className="min-h-[100px] w-full resize-y rounded-xl border border-line bg-paper p-4 leading-relaxed text-ink-body transition-card duration-300 hover:border-ink-ghost focus:border-ink"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="note-type">
              {t('add_note')}
            </label>
            <select
              id="note-type"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="min-h-[44px] rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink transition-card duration-300 hover:border-ink-ghost focus:border-ink"
            >
              <option value="note">{t('add_note')}</option>
              <option value="question">{t('add_question')}</option>
            </select>
            <Button onClick={handleAddNote} disabled={!noteText.trim()} className="flex-1 sm:flex-none">
              <Icon name="plus" size="sm" />
              {t('save_note')}
            </Button>
          </div>
        </Card>

        {notes.length === 0 ? (
          <Card className="px-6 py-12 text-center">
            <p className="text-sm text-ink-muted">{t('no_notes')}</p>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notes.map((note) => (
              <Card key={note.id} data-note-id={note.id} className="p-4 sm:p-5">
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      defaultValue={note.text}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== note.text) {
                          handleUpdateNote(note.id, e.target.value.trim());
                        } else {
                          setEditingNoteId(null);
                        }
                      }}
                      className="min-h-[80px] w-full resize-y rounded-xl border border-line bg-paper p-3 leading-relaxed text-ink-body"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const el = document.querySelector(`[data-note-id="${note.id}"] textarea`);
                          if (el && el.value.trim()) {
                            handleUpdateNote(note.id, el.value.trim());
                          } else {
                            setEditingNoteId(null);
                          }
                        }}
                      >
                        {t('save_note')}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingNoteId(null)}>
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <Icon name={note.type === 'question' ? 'quiz' : 'note'} size="xs" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(note.id)}>
                          <Icon name="edit" size="sm" />
                          {t('edit_note')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteNote(note.id)}>
                          <Icon name="trash" size="sm" />
                          {t('delete_note')}
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-ink-body">{note.text}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-stretch gap-3 border-t border-line pt-6 sm:mt-10 sm:gap-4 sm:pt-8">
        {prevLesson ? (
          <Button
            to={`/section/${sectionId}/lesson/${prevLesson.id}`}
            variant="secondary"
            size="sm"
            className="flex-1 flex-col items-start gap-1"
          >
            <span className="text-xs font-normal text-ink-muted">{t('previous')}</span>
            <span className="line-clamp-1 font-medium">{pick(prevLesson, 'title')}</span>
          </Button>
        ) : (
          <span className="flex-1" />
        )}
        {nextLesson ? (
          <Button
            to={`/section/${sectionId}/lesson/${nextLesson.id}`}
            size="sm"
            className="flex-1 flex-col items-end gap-1"
          >
            <span className="text-xs font-normal text-ink-ghost">{t('next')}</span>
            <span className="line-clamp-1 font-medium">{pick(nextLesson, 'title')}</span>
          </Button>
        ) : (
          <span className="flex-1" />
        )}
      </div>

      <p className="mt-8 text-center text-xs text-ink-muted">
        <Link to={`/sections/${sectionId}`} className="underline underline-offset-4 hover:text-ink">
          {t('browse_sections')}
        </Link>
      </p>
    </PageShell>
  );
};

export { LessonDetailPage };
