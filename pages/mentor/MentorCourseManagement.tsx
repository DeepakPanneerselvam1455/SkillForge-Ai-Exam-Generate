import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const MentorCourseManagement: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const fetchCourses = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const allCourses = await api.getCourses();
            setCourses(allCourses.filter(c => c.mentorId === user.id));
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [user]);

    if (isLoading) {
        return <div className="text-center p-8">Loading courses...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>Create Course</Button>
            </div>

            {courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map(course => (
                        <Card key={course.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{course.title}</CardTitle>
                                <CardDescription>{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3">
                                <Badge variant="secondary">{course.difficulty}</Badge>
                                <div className="flex flex-wrap gap-2">
                                    {course.topics.map(topic => <Badge key={topic} variant="outline">{topic}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link to={`/mentor/course/${course.id}/quizzes`}>Manage Quizzes</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <p className="text-lg font-semibold">No courses yet.</p>
                    <p className="text-slate-500 dark:text-slate-400">Click "Create Course" to get started.</p>
                </div>
            )}
            
            <CreateCourseDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCourseCreated={fetchCourses}
            />
        </div>
    );
};

// --- Create Course Dialog Component ---
interface CreateCourseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCourseCreated: () => void;
}
const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({ isOpen, onClose, onCourseCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [topics, setTopics] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        setError('');
        try {
            await api.createCourse({
                title,
                description,
                difficulty,
                topics: topics.split(',').map(t => t.trim()).filter(Boolean),
                mentorId: user.id
            });
            onCourseCreated();
            onClose();
            // Reset form
            setTitle(''); setDescription(''); setDifficulty('Beginner'); setTopics('');
        } catch(err) {
            setError('Failed to create course. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Course">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                    <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
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
                    <label htmlFor="topics" className="block text-sm font-medium mb-1">Topics (comma-separated)</label>
                    <Input id="topics" value={topics} onChange={e => setTopics(e.target.value)} placeholder="e.g. Variables, Functions, Arrays" required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Course'}</Button>
                </div>
            </form>
        </Dialog>
    );
}

export default MentorCourseManagement;
