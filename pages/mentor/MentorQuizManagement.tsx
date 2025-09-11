import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, Question } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const MentorQuizManagement: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    const fetchQuizzes = async () => {
        if (!courseId) return;
        setIsLoading(true);
        try {
            const allCourses = await api.getCourses();
            setCourse(allCourses.find(c => c.id === courseId) || null);
            const courseQuizzes = await api.getQuizzesByCourse(courseId);
            setQuizzes(courseQuizzes);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, [courseId]);

    if (isLoading) {
        return <div className="text-center p-8">Loading quizzes...</div>;
    }
    
    if (!course) {
        return <div className="text-center p-8">Course not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link to="/mentor/courses" className="text-sm text-indigo-600 hover:underline">← Back to Courses</Link>
                    <h1 className="text-3xl font-bold tracking-tight">{course.title} Quizzes</h1>
                </div>
                <Button onClick={() => setIsGeneratorOpen(true)}>Generate AI Quiz</Button>
            </div>

            {quizzes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {quizzes.map(quiz => (
                        <Card key={quiz.id}>
                            <CardHeader>
                                <CardTitle>{quiz.title}</CardTitle>
                                <CardDescription>{quiz.questions.length} Questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary">{quiz.difficulty}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <p className="text-lg font-semibold">No quizzes for this course yet.</p>
                    <p className="text-slate-500 dark:text-slate-400">Use the AI Generator to create the first one!</p>
                </div>
            )}

            <QuizGeneratorDialog
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                onQuizCreated={fetchQuizzes}
                course={course}
            />
        </div>
    );
};

// --- AI Quiz Generator Dialog ---
interface QuizGeneratorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onQuizCreated: () => void;
    course: Course;
}
const QuizGeneratorDialog: React.FC<QuizGeneratorDialogProps> = ({ isOpen, onClose, onQuizCreated, course }) => {
    const { user } = useAuth();
    const [topic, setTopic] = useState(course.topics[0] || '');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(course.difficulty);
    const [numQuestions, setNumQuestions] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsGenerating(true);
        setError('');
        try {
            const generatedQuestions: Question[] = await api.generateQuizQuestions(topic, difficulty, numQuestions);
            
            await api.createQuiz({
                courseId: course.id,
                title: `${topic} Quiz (${difficulty})`,
                questions: generatedQuestions,
                difficulty,
                createdBy: user.id
            });
            onQuizCreated();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="AI Quiz Generator" description={`For "${course.title}"`}>
            <form onSubmit={handleGenerate} className="space-y-4">
                 <div>
                    <label htmlFor="topic" className="block text-sm font-medium mb-1">Quiz Topic</label>
                    <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., JavaScript Functions" required />
                     <p className="text-xs text-slate-500 mt-1">Suggestions: {course.topics.join(', ')}</p>
                </div>
                 <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                    <Select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)} required>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </Select>
                </div>
                 <div>
                    <label htmlFor="numQuestions" className="block text-sm font-medium mb-1">Number of Questions</label>
                    <Input id="numQuestions" type="number" min="1" max="10" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                Generating...
                            </>
                        ) : 'Generate Quiz'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
};

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default MentorQuizManagement;
