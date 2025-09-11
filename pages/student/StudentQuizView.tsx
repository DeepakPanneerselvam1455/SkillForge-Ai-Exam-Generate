import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

const StudentQuizView: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!quizId) return;
            try {
                const quizData = await api.getQuizById(quizId);
                setQuiz(quizData);
            } catch (error) {
                console.error("Failed to fetch quiz", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!quiz || !user) return;
        
        let calculatedScore = 0;
        quiz.questions.forEach(q => {
            if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
                calculatedScore += q.points;
            }
        });
        
        setScore(calculatedScore);
        setIsFinished(true);

        const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

        await api.submitQuizAttempt({
            quizId: quiz.id,
            studentId: user.id,
            answers,
            score: calculatedScore,
            totalPoints,
        });
    };

    const handleRetakeQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsFinished(false);
        setScore(0);
    };

    if (isLoading) return <div className="text-center p-8">Loading quiz...</div>;
    if (!quiz) return <div className="text-center p-8">Quiz not found.</div>;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    if (isFinished) {
        const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Quiz Review</CardTitle>
                        <CardDescription>You've finished the "{quiz.title}" quiz.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                        <p className="text-lg font-medium">Your Score:</p>
                        <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                            {score} / {totalPoints}
                        </p>
                        <p className="text-2xl text-slate-600 dark:text-slate-300">
                           That's {percentage}%!
                        </p>
                    </CardContent>
                </Card>

                <h2 className="text-2xl font-bold">Question Breakdown</h2>

                <div className="space-y-4">
                    {quiz.questions.map((question, index) => {
                        const userAnswer = answers[question.id] || "Not Answered";
                        const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
                        
                        return (
                            <Card 
                                key={question.id}
                                className={cn(isCorrect 
                                    ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/20' 
                                    : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/20'
                                )}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{index + 1}. {question.question}</p>
                                        {isCorrect ? (
                                            <Badge variant="success" className="whitespace-nowrap">
                                                <CheckIcon className="w-3.5 h-3.5 mr-1.5" />
                                                Correct
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="whitespace-nowrap">
                                                <XIcon className="w-3.5 h-3.5 mr-1.5" />
                                                Incorrect
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm border-t dark:border-slate-800 pt-4 mt-4">
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium text-slate-500 dark:text-slate-400 w-28 shrink-0">Your Answer:</span>
                                        <span className={`flex-1 font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                            {userAnswer}
                                        </span>
                                    </div>
                                    {!isCorrect && (
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium text-slate-500 dark:text-slate-400 w-28 shrink-0">Correct Answer:</span>
                                            <span className="flex-1 font-semibold text-green-700 dark:text-green-400">
                                                {question.correctAnswer}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button onClick={handleRetakeQuiz} variant="outline" className="w-full">
                        Retake Quiz
                    </Button>
                    <Button onClick={() => navigate('/student/quizzes')} className="w-full">
                        Back to Quizzes
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardDescription>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="font-semibold text-lg mb-4">{currentQuestion.question}</p>
                        <div className="space-y-3">
                        {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map(option => (
                            <label key={option} className="flex items-center p-3 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-900/50">
                                <input
                                    type="radio"
                                    name={currentQuestion.id}
                                    value={option}
                                    checked={answers[currentQuestion.id] === option}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                    className="w-4 h-4 mr-3"
                                />
                                {option}
                            </label>
                        ))}
                        {currentQuestion.type === 'short-answer' && (
                            <Input
                                type="text"
                                placeholder="Your answer..."
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            />
                        )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>Previous</Button>
                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                        <Button onClick={handleSubmit}>Submit</Button>
                    ) : (
                        <Button onClick={handleNext}>Next</Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default StudentQuizView;