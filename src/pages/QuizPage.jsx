import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizzesService } from '../firebase/service';
import { useTranslation } from 'react-i18next';

const QuizPage = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await quizzesService.getQuizById(quizId);
        setQuiz(quizData);
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    setSelectedAnswer(answerIndex);
    
    if (answerIndex === quiz.questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border border-black text-center">
          <h2 className="text-2xl font-bold mb-4 text-black">{t('quiz')}</h2>
          <div className="text-6xl font-bold text-black mb-4">{percentage}%</div>
          <p className="text-gray-600 mb-8">
            {t('your_score')}: {score} {t('of')} {quiz.questions.length}
          </p>
          <div className="space-y-4">
            <Link
              to={`/section/lessons/${quiz.lessonId}`}
              className="block w-full px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              {t('retake')}
            </Link>
            <Link
              to="/"
              className="block w-full px-6 py-3 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {t('go_home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const questionText = currentQuestion.question_ar || currentQuestion.question_en;
  const options = currentQuestion.options_ar || currentQuestion.options_en;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {t('question')} {currentQuestionIndex + 1} {t('of')} {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-600">{score} / {quiz.questions.length}</span>
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
          <h2 className="text-2xl font-bold mb-8 text-black">{questionText}</h2>
          
          <div className="space-y-4">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              
              let buttonClass = 'w-full text-right p-4 rounded border-2 transition-colors ';
              if (selectedAnswer === null) {
                buttonClass += 'border-gray-200 hover:border-black hover:bg-gray-50';
              } else if (isSelected && isCorrect) {
                buttonClass += 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50';
              } else if (!isSelected && isCorrect && selectedAnswer !== null) {
                buttonClass += 'border-green-500 bg-green-50';
              } else {
                buttonClass += 'border-gray-200 bg-white';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={buttonClass}
                >
                  <span className="text-lg">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        {selectedAnswer !== null && (
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
