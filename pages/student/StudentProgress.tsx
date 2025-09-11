import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { QuizAttempt, Quiz } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

const StudentProgress: React.FC = () => {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [quizzes, setQuizzes] = useState<{ [id: string]: Quiz }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [userAttempts, allQuizzes] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getCourses().then(courses => Promise.all(courses.map(c => api.getQuizzesByCourse(c.id)))).then(quizzes => quizzes.flat())
                ]);
                
                // Sort oldest to newest for a chronological line chart
                setAttempts(userAttempts.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()));
                
                const quizzesMap = allQuizzes.reduce((acc, quiz) => {
                    acc[quiz.id] = quiz;
                    return acc;
                }, {} as { [id: string]: Quiz });
                setQuizzes(quizzesMap);

            } catch (error) {
                console.error("Failed to fetch student progress", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const chartData = useMemo(() => {
        return attempts.map(attempt => ({
            name: quizzes[attempt.quizId]?.title || 'Quiz',
            score: Math.round((attempt.score / attempt.totalPoints) * 100),
            date: new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })).slice(-10); // last 10 attempts
    }, [attempts, quizzes]);

    // SVG Line Chart constants and calculations
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 220; // Increased height for X-axis labels
    const PADDING = 30;
    const Y_AXIS_LABELS = [0, 25, 50, 75, 100];

    const pointCoordinates = useMemo(() => {
        if (chartData.length < 2) return [];
        return chartData.map((data, index) => {
            const x = PADDING + (index / (chartData.length - 1)) * (SVG_WIDTH - 2 * PADDING);
            const y = (SVG_HEIGHT - PADDING) - (data.score / 100) * (SVG_HEIGHT - 2 * PADDING);
            return { x, y };
        });
    }, [chartData]);

    const pathData = useMemo(() => {
        if (pointCoordinates.length < 2) return '';
        return pointCoordinates
            .map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`)
            .join(' ');
    }, [pointCoordinates]);
    
    // Create a reversed list for the table display (newest first)
    const reversedAttempts = useMemo(() => [...attempts].reverse(), [attempts]);

    if (isLoading) {
        return <div className="text-center p-8">Loading progress...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Performance Trend</CardTitle>
                    <CardDescription>Your scores on the last {chartData.length} quizzes.</CardDescription>
                </CardHeader>
                <CardContent>
                     {chartData.length > 1 ? (
                        <div className="relative w-full h-80" onMouseLeave={() => setHoveredIndex(null)}>
                            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" aria-labelledby="chart-title" role="img">
                                <title id="chart-title">Line chart showing quiz score trend</title>
                                {/* Y-axis labels and grid lines */}
                                {Y_AXIS_LABELS.map(label => {
                                    const y = (SVG_HEIGHT - PADDING) - (label / 100) * (SVG_HEIGHT - 2 * PADDING);
                                    return (
                                        <g key={label} className="text-slate-400 dark:text-slate-600">
                                            <text x={PADDING - 10} y={y + 3} textAnchor="end" className="text-xs fill-current">{label}%</text>
                                            <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={y} y2={y} className="stroke-current opacity-50" strokeDasharray="2,4" />
                                        </g>
                                    );
                                })}
                                {/* X-axis line */}
                                <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={SVG_HEIGHT - PADDING} y2={SVG_HEIGHT - PADDING} className="stroke-current text-slate-300 dark:text-slate-700" />
                                {/* X-axis labels */}
                                {pointCoordinates.map(({ x }, index) => (
                                    <text
                                        key={`x-label-${index}`}
                                        x={x}
                                        y={SVG_HEIGHT - PADDING + 15}
                                        textAnchor="middle"
                                        className="text-xs fill-current text-slate-500 dark:text-slate-400"
                                    >
                                        {chartData[index].date}
                                    </text>
                                ))}
                                {/* Line Path */}
                                <path d={pathData} fill="none" strokeWidth="2" className="text-indigo-500 stroke-current" />
                                {/* Data Points and Hover Areas */}
                                {pointCoordinates.map(({ x, y }, index) => (
                                    <g key={index}>
                                        <circle cx={x} cy={y} r={hoveredIndex === index ? 6 : 4} className="text-indigo-500 fill-current transition-all" />
                                        <rect x={x - 10} y={y - 10} width="20" height="20" fill="transparent" onMouseEnter={() => setHoveredIndex(index)} />
                                    </g>
                                ))}
                            </svg>
                             {/* Tooltip */}
                            {hoveredIndex !== null && (
                                <div
                                    className="absolute p-2 text-sm bg-slate-900 text-white rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity"
                                    style={{
                                        left: `${(pointCoordinates[hoveredIndex].x / SVG_WIDTH) * 100}%`,
                                        top: `${(pointCoordinates[hoveredIndex].y / SVG_HEIGHT) * 100}%`,
                                        marginTop: '-10px'
                                    }}
                                >
                                    <p className="font-semibold whitespace-nowrap">{chartData[hoveredIndex].name}</p>
                                    <p>Score: <span className="font-bold">{chartData[hoveredIndex].score}%</span></p>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="text-center py-10 h-80 flex items-center justify-center">
                            <p className="text-slate-500 dark:text-slate-400">
                                {chartData.length < 2 ? "At least two quiz attempts are needed to show a trend." : "No data to display. Take a quiz to see your trend!"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Attempt History</CardTitle>
                    <CardDescription>A complete log of all your quiz attempts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reversedAttempts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Quiz</th>
                                        <th scope="col" className="px-6 py-3">Score</th>
                                        <th scope="col" className="px-6 py-3">Percentage</th>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reversedAttempts.map(attempt => (
                                        <tr key={attempt.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                            <td className="px-6 py-4 font-medium">{quizzes[attempt.quizId]?.title || 'Unknown Quiz'}</td>
                                            <td className="px-6 py-4">{attempt.score} / {attempt.totalPoints}</td>
                                            <td className="px-6 py-4 font-bold">{Math.round((attempt.score / attempt.totalPoints) * 100)}%</td>
                                            <td className="px-6 py-4">{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <p className="text-slate-500 dark:text-slate-400 text-center py-8">You haven't attempted any quizzes yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentProgress;