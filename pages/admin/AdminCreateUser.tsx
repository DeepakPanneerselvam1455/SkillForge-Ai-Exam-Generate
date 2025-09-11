
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const AdminCreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await api.createUser({ name, email, role }, password);
            navigate('/admin/users'); // Redirect on success
        } catch(err: any) {
            setError(err.message || 'Failed to create user. The email might already be in use.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                        <CardDescription>Fill in the details to register a new user for the SkillForge platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required aria-describedby="password-help"/>
                            <p id="password-help" className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
                            <Select id="role" value={role} onChange={e => setRole(e.target.value as any)} required>
                                <option value="student">Student</option>
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                           <Link to="/admin/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

export default AdminCreateUser;
