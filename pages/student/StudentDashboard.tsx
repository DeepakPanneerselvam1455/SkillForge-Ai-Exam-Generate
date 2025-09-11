import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, QuizAttempt } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ completed: 0, average: 0 });
    const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
    const [recommendedQuizzes, setRecommendedQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [attempts, allQuizzes] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getCourses().then(courses => Promise.all(courses.map(c => api.getQuizzesByCourse(c.id)))).then(quizzes => quizzes.flat())
                ]);

                if (attempts.length > 0) {
                    const totalScore = attempts.reduce((acc, a) => acc + (a.score / a.totalPoints) * 100, 0);
                    setStats({
                        completed: attempts.length,
                        average: Math.round(totalScore / attempts.length),
                    });
                }
                
                setRecentAttempts(attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 3));

                const attemptedQuizIds = new Set(attempts.map(a => a.quizId));
                setRecommendedQuizzes(allQuizzes.filter(q => !attemptedQuizIds.has(q.id)).slice(0, 3));
                
            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}!</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Quizzes Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.average}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recommended Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recommendedQuizzes.length > 0 ? (
                            <ul className="space-y-4">
                                {recommendedQuizzes.map(quiz => (
                                    <li key={quiz.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{quiz.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{quiz.difficulty}</p>
                                        </div>
                                        <Button asChild size="sm">
                                            <Link to={`/student/quiz/${quiz.id}`}>Start Quiz</Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400">You've attempted all available quizzes! Great job!</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentAttempts.length > 0 ? (
                            <ul className="space-y-4">
                                {recentAttempts.map(attempt => (
                                    <li key={attempt.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <p className="font-semibold">Quiz Attempt</p>
                                        <p className="text-sm font-bold">{Math.round((attempt.score / attempt.totalPoints) * 100)}%</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(attempt.submittedAt).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400">No recent activity. Time to take a quiz!</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
