import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizzesService, lessonsService } from '../firebase/service';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { useLocalized, lessonUrl } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader, SectionTitle } from '../components/UI/PageHeader';
import { BackLink } from '../components/UI/BackLink';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';
import { cn } from '../utils/cn';

const QuizPage = () => {
  const { lessonId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizRecorded, setQuizRecorded] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const { recordQuizResult } = useUserProgress();

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const [quizzesData, lessonData] = await Promise.all([
          quizzesService.getQuizByLesson(lessonId),
          lessonsService.getLessonById(lessonId)
        ]);
        setQuiz(quizzesData[0] || null);
        setLesson(lessonData);
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
    setSelectedAnswers({});
    setScore(0);
    setShowResult(false);
    setCurrentQuestionIndex(0);
    setQuizRecorded(false);
  }, [lessonId]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      const totalScore = quiz.questions.reduce(
        (acc, q, i) => acc + (selectedAnswers[i] === q.correctAnswer ? 1 : 0),
        0
      );
      setScore(totalScore);
      setShowResult(true);
      if (!quizRecorded) {
        setQuizRecorded(true);
        await recordQuizResult(totalScore, quiz.questions.length);
      }
    }
  };

  const handleRetake = useCallback(() => {
    setSelectedAnswers({});
    setScore(0);
    setShowResult(false);
    setCurrentQuestionIndex(0);
    setQuizRecorded(false);
  }, []);

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  const backLink = lesson ? lessonUrl(lesson) : '/sections';

  if (!quiz) {
    return (
      <PageShell width="narrow">
        <EmptyState
          icon="quiz"
          title={t('no_quiz')}
          action={
            <Button to={backLink}>
              {t('back_to_lesson')}
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <PageShell width="narrow">
        <Card className="mb-8 p-6 text-center sm:p-8">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{pick(quiz, 'title')}</h1>
          <p className="my-6 text-5xl font-bold tabular-nums text-ink sm:text-6xl">
            {percentage}%
          </p>
          <p className="mb-8 text-sm text-ink-muted">
            {t('your_score')}: <span className="tabular-nums">{score}</span> {t('of')}{' '}
            <span className="tabular-nums">{quiz.questions.length}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleRetake} className="flex-1">
              <Icon name="history" size="sm" />
              {t('retake')}
            </Button>
            <Button to={backLink} variant="secondary" className="flex-1">
              {t('back_to_lesson')}
            </Button>
          </div>
        </Card>

        <SectionTitle className="mb-5">{t('review_answers')}</SectionTitle>
        <div className="space-y-4 sm:space-y-5">
          {quiz.questions.map((q, qIndex) => {
            const userAnswer = selectedAnswers[qIndex];
            const isCorrect = userAnswer === q.correctAnswer;
            const options = pick(q, 'options');

            return (
              <Card key={qIndex} className="p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="text-base font-semibold leading-relaxed text-ink sm:text-lg">
                    {qIndex + 1}. {pick(q, 'question')}
                  </p>
                  <Badge
                    variant={isCorrect ? 'outline' : 'solid'}
                    icon={isCorrect ? <Icon name="check" size="xs" strokeWidth={2.5} /> : <Icon name="close" size="xs" strokeWidth={2.5} />}
                    className="mt-1 shrink-0"
                  >
                    {isCorrect ? t('correct') : t('incorrect')}
                  </Badge>
                </div>

                <ul className="space-y-2">
                  {options.map((option, oIndex) => {
                    const isOptionCorrect = oIndex === q.correctAnswer;
                    const isUserOption = oIndex === userAnswer;
                    return (
                      <li
                        key={oIndex}
                        className={cn(
                          'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
                          isOptionCorrect
                            ? 'border-ink bg-surface-quiet font-medium text-ink'
                            : isUserOption
                              ? 'border-ink-ghost bg-surface text-ink-soft'
                              : 'border-line bg-paper text-ink-muted'
                        )}
                      >
                        {isOptionCorrect ? (
                          <Icon name="check" size="sm" className="mt-0.5 shrink-0 text-ink" strokeWidth={2.5} />
                        ) : isUserOption ? (
                          <Icon name="close" size="sm" className="mt-0.5 shrink-0 text-ink-muted" strokeWidth={2.5} />
                        ) : (
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-line" />
                        )}
                        <span>{option}</span>
                      </li>
                    );
                  })}
                </ul>

                {pick(q, 'explanation') && (
                  <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-muted">
                    <strong className="font-semibold text-ink">{t('explanation')}:</strong>{' '}
                    {pick(q, 'explanation')}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </PageShell>
    );
  }

  const questionText = pick(currentQuestion, 'question');
  const options = pick(currentQuestion, 'options');
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const hasSelection = selectedAnswer !== null && selectedAnswer !== undefined;
  const questionProgress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <PageShell width="narrow">
      <BackLink to={backLink} className="mb-4">
        {t('back_to_lesson')}
      </BackLink>

      <div className="mb-6 mt-4 sm:mb-8">
        <PageHeader title={pick(quiz, 'title')} />
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-ink-muted">
          <span>
            {t('question')} {currentQuestionIndex + 1} {t('of')}{' '}
            <span className="tabular-nums">{quiz.questions.length}</span>
          </span>
          <span className="tabular-nums">
            {score} / {quiz.questions.length}
          </span>
        </div>
        <ProgressBar value={questionProgress} label={t('question')} />
      </div>

      <Card className="p-5 sm:p-8">
        <h2 className="mb-6 text-lg font-bold leading-relaxed text-ink sm:text-2xl">
          {questionText}
        </h2>

        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={hasSelection}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full min-h-[56px] items-center gap-3 rounded-xl border-2 px-4 py-3 text-start transition-card duration-300 disabled:cursor-default',
                  !hasSelection
                    ? 'border-line bg-paper hover:border-ink hover:bg-surface'
                    : isSelected && isCorrect
                      ? 'border-ink bg-surface-quiet'
                      : isSelected && !isCorrect
                        ? 'border-ink-soft bg-surface'
                        : isCorrect
                          ? 'border-ink-ghost bg-surface-quiet'
                          : 'border-line bg-paper text-ink-muted'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                    isSelected
                      ? 'border-ink bg-ink text-white'
                      : 'border-line text-ink-muted'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-base text-ink-body">{option}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {hasSelection && (
        <div className="mt-6 flex justify-center sm:mt-8">
          <Button onClick={handleNextQuestion} size="lg" className="w-full sm:w-auto">
            {currentQuestionIndex < quiz.questions.length - 1 ? t('next') : t('submit')}
            <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link to={backLink} className="underline underline-offset-4 hover:text-ink">
          {t('back_to_lesson')}
        </Link>
      </p>
    </PageShell>
  );
};

export { QuizPage };
