import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { Course, Quiz, QuizAttempt, User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

interface CourseAnalytics {
    course: Course;
    mentorName: string;
    quizCount: number;
    attemptCount: number;
    averageScore: number;
}

const AdminCourseAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courses, users, allAttempts] = await Promise.all([
                    api.getCourses(),
                    api.getUsers(),
                    api.getAllAttempts()
                ]);

                const usersMap = users.reduce((acc, u) => {
                    acc[u.id] = u.name;
                    return acc;
                }, {} as { [id: string]: string });

                const courseAnalytics: CourseAnalytics[] = [];

                for (const course of courses) {
                    const courseQuizzes = await api.getQuizzesByCourse(course.id);
                    const courseQuizIds = new Set(courseQuizzes.map(q => q.id));
                    const courseAttempts = allAttempts.filter(a => courseQuizIds.has(a.quizId));

                    let averageScore = 0;
                    if (courseAttempts.length > 0) {
                        const total = courseAttempts.reduce((sum, a) => sum + (a.score / a.totalPoints * 100), 0);
                        averageScore = Math.round(total / courseAttempts.length);
                    }
                    
                    courseAnalytics.push({
                        course,
                        mentorName: usersMap[course.mentorId] || 'Unknown',
                        quizCount: courseQuizzes.length,
                        attemptCount: courseAttempts.length,
                        averageScore
                    });
                }
                setAnalytics(courseAnalytics.sort((a,b) => b.attemptCount - a.attemptCount));
            } catch (error) {
                console.error("Failed to fetch course analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="text-center p-8">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System-Wide Course Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400">Engagement and performance metrics for all courses.</p>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Course</th>
                                    <th scope="col" className="px-6 py-3">Mentor</th>
                                    <th scope="col" className="px-6 py-3">Quizzes</th>
                                    <th scope="col" className="px-6 py-3">Total Attempts</th>
                                    <th scope="col" className="px-6 py-3">Avg. Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.map(({ course, mentorName, quizCount, attemptCount, averageScore }) => (
                                    <tr key={course.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                        <td className="px-6 py-4 font-medium">{course.title}</td>
                                        <td className="px-6 py-4">{mentorName}</td>
                                        <td className="px-6 py-4 text-center">{quizCount}</td>
                                        <td className="px-6 py-4 text-center">{attemptCount}</td>
                                        <td className="px-6 py-4 font-bold text-center">{attemptCount > 0 ? `${averageScore}%` : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCourseAnalytics;
