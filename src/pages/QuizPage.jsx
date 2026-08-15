import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizzesService, lessonsService } from '../firebase/service';
import { useTranslation } from 'react-i18next';
import { useLocalized, lessonUrl } from '../utils/helpers';

const QuizPage = () => {
  const { lessonId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { pick } = useLocalized();

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
  }, [lessonId]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      const totalScore = quiz.questions.reduce(
        (acc, q, i) => acc + (selectedAnswers[i] === q.correctAnswer ? 1 : 0),
        0
      );
      setScore(totalScore);
      setShowResult(true);
    }
  };

  const handleRetake = useCallback(() => {
    setSelectedAnswers({});
    setScore(0);
    setShowResult(false);
    setCurrentQuestionIndex(0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const backLink = lesson ? lessonUrl(lesson) : '/sections';

  if (!quiz) {
    return (
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">{t('no_quiz')}</p>
          <Link
            to={backLink}
            className="inline-block mt-6 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            {t('back_to_lesson')}
          </Link>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 border border-black text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 text-black">{pick(quiz, 'title')}</h2>
            <div className="text-6xl font-bold text-black mb-4">{percentage}%</div>
            <p className="text-gray-600 mb-8">
              {t('your_score')}: {score} {t('of')} {quiz.questions.length}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleRetake}
                className="block w-full px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                {t('retake')}
              </button>
              <Link
                to={backLink}
                className="block w-full px-6 py-3 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors"
              >
                {t('back_to_lesson')}
              </Link>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4 text-black">{t('review_answers')}</h3>
          <div className="space-y-6">
            {quiz.questions.map((q, qIndex) => {
              const userAnswer = selectedAnswers[qIndex];
              const isCorrect = userAnswer === q.correctAnswer;
              const options = pick(q, 'options');

              return (
                <div key={qIndex} className="bg-white rounded-lg shadow-md p-6 border border-black">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-lg font-semibold text-black">
                      {qIndex + 1}. {pick(q, 'question')}
                    </p>
                    <span
                      className={`shrink-0 px-3 py-1 rounded text-sm font-medium rtl:mr-3 ltr:ml-3 ${
                        isCorrect ? 'bg-gray-200 text-black' : 'bg-black text-white'
                      }`}
                    >
                      {isCorrect ? '✓' : '✕'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {options.map((option, oIndex) => {
                      const isOptionCorrect = oIndex === q.correctAnswer;
                      const isUserOption = oIndex === userAnswer;
                      let classes = 'p-3 rounded border-2 text-sm ';
                      if (isOptionCorrect) {
                        classes += 'border-gray-400 bg-gray-100';
                      } else if (isUserOption) {
                        classes += 'border-black bg-gray-50';
                      } else {
                        classes += 'border-gray-200 bg-white text-gray-500';
                      }
                      return (
                        <div key={oIndex} className={classes}>
                          <span className="font-medium">
                            {isOptionCorrect ? '✓ ' : isUserOption ? '✕ ' : ''}
                          </span>
                          {option}
                        </div>
                      );
                    })}
                  </div>

                  {(pick(q, 'explanation')) && (
                    <p className="mt-4 text-sm text-gray-600 border-t border-gray-200 pt-3">
                      <strong>{t('explanation')}:</strong> {pick(q, 'explanation')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const questionText = pick(currentQuestion, 'question');
  const options = pick(currentQuestion, 'options');
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">{pick(quiz, 'title')}</h2>
          <Link to={backLink} className="text-black hover:text-gray-600 text-sm">
            {t('back_to_lesson')}
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {t('question')} {currentQuestionIndex + 1} {t('of')} {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {score} / {quiz.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-8 border border-black mb-8">
          <h3 className="text-2xl font-bold mb-8 text-black">{questionText}</h3>

          <div className="space-y-4">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;

              let buttonClass = 'w-full text-right rtl:text-right ltr:text-left p-4 rounded border-2 transition-colors ';
              if (selectedAnswer === null || selectedAnswer === undefined) {
                buttonClass += 'border-gray-200 hover:border-black hover:bg-gray-50';
              } else if (isSelected && isCorrect) {
                buttonClass += 'border-gray-400 bg-gray-100';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-black bg-gray-50';
              } else if (!isSelected && isCorrect) {
                buttonClass += 'border-gray-300 bg-gray-50';
              } else {
                buttonClass += 'border-gray-200 bg-white';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null && selectedAnswer !== undefined}
                  className={buttonClass}
                >
                  <span className="text-lg">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        {selectedAnswer !== null && selectedAnswer !== undefined && (
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? t('next') : t('submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { QuizPage };
