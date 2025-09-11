import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const AdminUserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await api.getUsers();
            setUsers(allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };
    
    const handleResetPasswordClick = (user: User) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const getRoleBadgeVariant = (role: User['role']): 'destructive' | 'secondary' | 'success' => {
        if (role === 'admin') return 'destructive'; // Red for high-privilege
        if (role === 'mentor') return 'secondary';   // Neutral gray for mentor
        return 'success'; // Green for student, indicating learning/growth
    }

    if (isLoading) {
        return <div className="text-center p-8">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">View, create, edit, and delete users.</p>
                </div>
                <Button asChild>
                    <Link to="/admin/users/create">Create User</Link>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Joined On</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                        <td className="px-6 py-4 font-medium">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <Button aria-label={`Edit ${user.name}`} variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                                    <EditIcon className="w-4 h-4" />
                                                </Button>
                                                <Button aria-label={`Reset password for ${user.name}`} title={`Reset password for ${user.name}`} variant="ghost" size="icon" onClick={() => handleResetPasswordClick(user)}>
                                                    <KeyIcon className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    aria-label={`Delete ${user.name}`} 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteClick(user)}
                                                    disabled={user.id === currentUser?.id}
                                                    title={user.id === currentUser?.id ? "You cannot delete your own account." : `Delete ${user.name}`}
                                                >
                                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            
            {selectedUser && (
                <>
                    <EditUserDialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUserUpdated={fetchUsers} user={selectedUser} />
                    <DeleteUserDialog isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onUserDeleted={fetchUsers} user={selectedUser} />
                    <ResetPasswordDialog isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} onPasswordReset={() => setIsResetPasswordModalOpen(false)} user={selectedUser} />
                </>
            )}
        </div>
    );
};


// --- Dialog Components ---

interface EditUserDialogProps { isOpen: boolean; onClose: () => void; onUserUpdated: () => void; user: User; }
const EditUserDialog: React.FC<EditUserDialogProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setError('');
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await api.updateUser({ ...user, name, email, role });
            onUserUpdated();
            onClose();
        } catch(err) {
            setError('Failed to update user.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Full Name</label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium mb-1">Email Address</label>
                    <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium mb-1">Role</label>
                    <Select id="edit-role" value={role} onChange={e => setRole(e.target.value as any)} required>
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Dialog>
    );
}

interface DeleteUserDialogProps { isOpen: boolean; onClose: () => void; onUserDeleted: () => void; user: User; }
const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ isOpen, onClose, onUserDeleted, user }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.deleteUser(user.id);
            onUserDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete user", err);
            // Optionally set an error state to show in the dialog
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Delete User"
            description={`Are you sure you want to delete ${user.name}? This action is permanent.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete User'}</Button>
            </div>
        </Dialog>
    );
}

interface ResetPasswordDialogProps { isOpen: boolean; onClose: () => void; onPasswordReset: () => void; user: User; }
const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ isOpen, onClose, onPasswordReset, user }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.resetPassword(user.id, newPassword);
            onPasswordReset();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Reset Password" description={`Set a new password for ${user.name}.`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium mb-1">New Password</label>
                    <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required aria-describedby="password-reset-help" />
                    <p id="password-reset-help" className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
                </div>
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Button>
                </div>
            </form>
        </Dialog>
    );
};


// --- Icon Components ---
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 11.5 3 3" />
    <path d="M14 7 9 2" />
  </svg>
);


export default AdminUserManagement;