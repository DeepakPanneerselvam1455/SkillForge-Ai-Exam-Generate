import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User, QuizAttempt, Quiz } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

interface StudentAnalytics {
    studentId: string;
    studentName: string;
    attempts: number;
    averageScore: number;
}

const MentorStudentAnalytics: React.FC = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                
                const mentorQuizzes: Quiz[] = [];
                for (const course of mentorCourses) {
                    mentorQuizzes.push(...await api.getQuizzesByCourse(course.id));
                }
                const mentorQuizIds = new Set(mentorQuizzes.map(q => q.id));

                const [allAttempts, allUsers] = await Promise.all([
                    api.getAllAttempts(),
                    api.getUsers()
                ]);

                const mentorAttempts = allAttempts.filter(a => mentorQuizIds.has(a.quizId));
                
                const studentData: { [id: string]: { totalScore: number, count: number } } = {};
                mentorAttempts.forEach(attempt => {
                    if (!studentData[attempt.studentId]) {
                        studentData[attempt.studentId] = { totalScore: 0, count: 0 };
                    }
                    studentData[attempt.studentId].totalScore += (attempt.score / attempt.totalPoints) * 100;
                    studentData[attempt.studentId].count++;
                });

                const usersMap = allUsers.reduce((acc, u) => {
                    acc[u.id] = u.name;
                    return acc;
                }, {} as { [id: string]: string });

                const formattedAnalytics: StudentAnalytics[] = Object.keys(studentData).map(studentId => ({
                    studentId,
                    studentName: usersMap[studentId] || 'Unknown Student',
                    attempts: studentData[studentId].count,
                    averageScore: Math.round(studentData[studentId].totalScore / studentData[studentId].count)
                })).sort((a, b) => b.averageScore - a.averageScore);

                setAnalytics(formattedAnalytics);

            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (isLoading) {
        return <div className="text-center p-8">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Student Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400">Performance overview of students who have taken your quizzes.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Student Leaderboard</CardTitle>
                    <CardDescription>Based on average score across all your quizzes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Student</th>
                                        <th scope="col" className="px-6 py-3">Quizzes Taken</th>
                                        <th scope="col" className="px-6 py-3">Average Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.map(data => (
                                        <tr key={data.studentId} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                            <td className="px-6 py-4 font-medium">{data.studentName}</td>
                                            <td className="px-6 py-4">{data.attempts}</td>
                                            <td className="px-6 py-4 font-bold">{data.averageScore}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">No student data available yet. Share your quizzes to get started!</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MentorStudentAnalytics;
