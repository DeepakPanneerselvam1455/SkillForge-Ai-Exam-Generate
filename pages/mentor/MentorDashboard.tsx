import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { Course, Quiz, QuizAttempt } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const MentorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ courses: 0, quizzes: 0, attempts: 0, avgScore: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);

                const mentorQuizzes: Quiz[] = [];
                for (const course of mentorCourses) {
                    const quizzes = await api.getQuizzesByCourse(course.id);
                    mentorQuizzes.push(...quizzes);
                }

                const allAttempts = await api.getAllAttempts();
                const mentorQuizIds = new Set(mentorQuizzes.map(q => q.id));
                const mentorAttempts = allAttempts.filter(a => mentorQuizIds.has(a.quizId));

                let avgScore = 0;
                if (mentorAttempts.length > 0) {
                    const totalScore = mentorAttempts.reduce((acc, a) => acc + (a.score / a.totalPoints) * 100, 0);
                    avgScore = Math.round(totalScore / mentorAttempts.length);
                }

                setStats({
                    courses: mentorCourses.length,
                    quizzes: mentorQuizzes.length,
                    attempts: mentorAttempts.length,
                    avgScore,
                });
            } catch (error) {
                console.error("Failed to fetch mentor dashboard data", error);
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
            <h1 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">My Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.courses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Quizzes Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.quizzes}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Student Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.attempts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Student Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.avgScore}%</div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Welcome, {user?.name}!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600 dark:text-slate-300">
                        This is your central hub for managing courses, creating quizzes, and analyzing student performance. 
                        Use the navigation on the left to get started. You can create new courses, generate AI-powered quizzes for your students, and view detailed analytics on their progress.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default MentorDashboard;
