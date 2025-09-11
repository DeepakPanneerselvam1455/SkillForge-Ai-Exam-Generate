
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const studentLinks = [
        { to: '/student', label: 'Dashboard', icon: HomeIcon },
        { to: '/student/quizzes', label: 'Quizzes', icon: BookOpenIcon },
        { to: '/student/progress', label: 'My Progress', icon: BarChartIcon },
    ];
    const mentorLinks = [
        { to: '/mentor', label: 'Dashboard', icon: HomeIcon },
        { to: '/mentor/courses', label: 'Courses', icon: LibraryIcon },
        { to: '/mentor/analytics', label: 'Student Analytics', icon: UsersIcon },
    ];
    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: HomeIcon },
        { to: '/admin/users', label: 'User Management', icon: UsersIcon },
        { to: '/admin/analytics', label: 'System Analytics', icon: BarChartIcon },
    ];

    let navLinks: { to: string, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [];
    if (user?.role === 'student') navLinks = studentLinks;
    if (user?.role === 'mentor') navLinks = mentorLinks;
    if (user?.role === 'admin') navLinks = adminLinks;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">SkillForge</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-white'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            )
                        }
                    >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {user?.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                    </div>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full mt-4">
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50">
                <div className="flex-1 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                   <SidebarContent />
                </div>
            </aside>
            
            {/* Mobile Sidebar */}
            {sidebarOpen && (
                 <div className="md:hidden fixed inset-0 flex z-40" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-950">
                       <SidebarContent />
                    </div>
                </div>
            )}

            <div className="md:pl-64 flex flex-col flex-1">
                <header className="flex md:hidden items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-500 dark:text-slate-400">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SkillForge</h1>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};


// Icon components
const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const BarChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);
const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 6 4 14" />
    <path d="M12 6v14" />
    <path d="M8 8v12" />
    <path d="M4 4v16" />
  </svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
);

export default Layout;
