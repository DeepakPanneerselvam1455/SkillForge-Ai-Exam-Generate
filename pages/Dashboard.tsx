
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    switch (user.role) {
        case 'student':
            return <Navigate to="/student" />;
        case 'mentor':
            return <Navigate to="/mentor" />;
        case 'admin':
            return <Navigate to="/admin" />;
        default:
            return <Navigate to="/login" />;
    }
};

export default Dashboard;
