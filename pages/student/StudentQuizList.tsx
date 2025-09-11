import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Course, Quiz } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface QuizWithCourse extends Quiz {
    courseTitle: string;
}

const StudentQuizList: React.FC = () => {
    const [quizzes, setQuizzes] = useState<QuizWithCourse[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithCourse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const courses = await api.getCourses();
                const allQuizzes: QuizWithCourse[] = [];
                for (const course of courses) {
                    const courseQuizzes = await api.getQuizzesByCourse(course.id);
                    courseQuizzes.forEach(quiz => {
                        allQuizzes.push({ ...quiz, courseTitle: course.title });
                    });
                }
                setQuizzes(allQuizzes);
                setFilteredQuizzes(allQuizzes);
            } catch (error) {
                console.error("Failed to fetch quizzes", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    useEffect(() => {
        let result = quizzes;
        if (searchTerm) {
            result = result.filter(q =>
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (difficultyFilter !== 'All') {
            result = result.filter(q => q.difficulty === difficultyFilter);
        }
        setFilteredQuizzes(result);
    }, [searchTerm, difficultyFilter, quizzes]);
    
    if (isLoading) {
        return <div className="text-center p-8">Loading quizzes...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Quizzes</h1>
                    <p className="text-slate-500 dark:text-slate-400">Test your knowledge across various topics.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Input 
                        placeholder="Search quizzes..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-48"
                    />
                    <Select 
                        value={difficultyFilter}
                        onChange={e => setDifficultyFilter(e.target.value)}
                        className="w-full md:w-40"
                    >
                        <option>All</option>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </Select>
                </div>
            </div>

            {filteredQuizzes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredQuizzes.map(quiz => (
                        <Card key={quiz.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{quiz.title}</CardTitle>
                                <CardDescription>{quiz.courseTitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{quiz.difficulty}</Badge>
                                    <span className="text-sm text-slate-500">{quiz.questions.length} Questions</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link to={`/student/quiz/${quiz.id}`}>Take Quiz</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold">No quizzes found.</p>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
};

export default StudentQuizList;
