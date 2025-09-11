import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { User, Course, Quiz, QuizAttempt } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, mentors: 0, students: 0, courses: 0, quizzes: 0, attempts: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [users, courses, quizzes, attempts] = await Promise.all([
                    api.getUsers(),
                    api.getCourses(),
                    api.getCourses().then(courses => Promise.all(courses.map(c => api.getQuizzesByCourse(c.id)))).then(quizzes => quizzes.flat()),
                    api.getAllAttempts()
                ]);

                setStats({
                    users: users.length,
                    mentors: users.filter(u => u.role === 'mentor').length,
                    students: users.filter(u => u.role === 'student').length,
                    courses: courses.length,
                    quizzes: quizzes.length,
                    attempts: attempts.length,
                });

            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const roleData = [
        { name: 'Students', value: stats.students, color: 'bg-indigo-500' },
        { name: 'Mentors', value: stats.mentors, color: 'bg-teal-500' },
    ];

    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.users}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.courses}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.quizzes}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full flex h-10 rounded-full overflow-hidden">
                           {roleData.map(role => (
                               <div key={role.name} className={`${role.color} flex items-center justify-center text-white text-sm font-bold`} style={{width: `${(role.value / (stats.students + stats.mentors)) * 100}%`}}>
                                   {role.value}
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-4">
                           {roleData.map(role => (
                               <div key={role.name} className="flex items-center gap-2">
                                   <span className={`w-3 h-3 rounded-full ${role.color}`}></span>
                                   <span className="text-sm">{role.name}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default AdminDashboard;
