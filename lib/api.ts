import { User, Course, Quiz, Question, QuizAttempt } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// --- MOCK DATABASE (LocalStorage) ---
const DB = {
    users: 'skillforge_users',
    courses: 'skillforge_courses',
    quizzes: 'skillforge_quizzes',
    attempts: 'skillforge_attempts',
};

const FAKE_DELAY = 500;

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), FAKE_DELAY));

// --- GEMINI API SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- DATA INITIALIZATION ---
export const initMockData = () => {
    if (localStorage.getItem(DB.users)) return;

    const now = new Date().toISOString();
    const adminId = 'user-admin-01';
    const mentorId = 'user-mentor-01';
    const studentId = 'user-student-01';
    
    const users: User[] = [
        { id: adminId, email: 'admin@skillforge.com', name: 'Admin User', role: 'admin', createdAt: now },
        { id: mentorId, email: 'mentor@skillforge.com', name: 'Mentor User', role: 'mentor', createdAt: now },
        { id: studentId, email: 'student@skillforge.com', name: 'Student User', role: 'student', createdAt: now },
    ];

    const courseId1 = 'course-js-01';
    const courseId2 = 'course-react-02';
    const courses: Course[] = [
        { id: courseId1, title: 'JavaScript Fundamentals', description: 'Master the basics of JavaScript.', difficulty: 'Beginner', mentorId, topics: ['Variables', 'Functions', 'Arrays', 'Objects'], createdAt: now },
        { id: courseId2, title: 'React Advanced Patterns', description: 'Learn advanced patterns for building scalable React apps.', difficulty: 'Advanced', mentorId, topics: ['Hooks', 'Context API', 'Performance', 'Render Props'], createdAt: now },
    ];

    const quizId1 = 'quiz-js-vars-01';
    const quizzes: Quiz[] = [
        {
            id: quizId1,
            courseId: courseId1,
            title: 'JavaScript Variables Quiz',
            difficulty: 'Beginner',
            createdBy: mentorId,
            createdAt: now,
            questions: [
                { id: 'q1', type: 'multiple-choice', question: 'Which keyword is used to declare a variable that cannot be reassigned?', options: ['let', 'var', 'const', 'static'], correctAnswer: 'const', points: 10 },
                { id: 'q2', type: 'short-answer', question: 'What is the data type of `null` in JavaScript?', correctAnswer: 'object', points: 10 },
            ],
        },
    ];

    localStorage.setItem(DB.users, JSON.stringify(users));
    localStorage.setItem(DB.courses, JSON.stringify(courses));
    localStorage.setItem(DB.quizzes, JSON.stringify(quizzes));
    localStorage.setItem(DB.attempts, JSON.stringify([]));

    // Mock passwords (in a real app, this would be hashed and stored securely)
    localStorage.setItem('user_passwords', JSON.stringify({
        'admin@skillforge.com': 'admin123',
        'mentor@skillforge.com': 'mentor123',
        'student@skillforge.com': 'student123',
    }));
};

// --- AUTHENTICATION ---
export const login = async (email: string, pass: string) => {
    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    if (passwords[email] !== pass) {
        await delay(null);
        throw new Error('Invalid credentials');
    }
    const users: User[] = JSON.parse(localStorage.getItem(DB.users) || '[]');
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');

    // "JWT" is the user object itself for this mock API
    const token = btoa(JSON.stringify(user));
    return delay({ token, user });
};

export const getProfile = async (): Promise<User> => {
    const token = localStorage.getItem('skillforge_token');
    if (!token) throw new Error('Not authenticated');
    try {
        const user: User = JSON.parse(atob(token));
        return delay(user);
    } catch (e) {
        throw new Error('Invalid token');
    }
};

// --- GENERIC CRUD ---
const getAll = async <T,>(key: string): Promise<T[]> => {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return delay(data as T[]);
};
const getById = async <T extends { id: string },>(key: string, id: string): Promise<T | null> => {
    const items = await getAll<T>(key);
    return delay(items.find(item => item.id === id) || null);
};
const create = async <T extends { id: string },>(key: string, item: T): Promise<T> => {
    const items = await getAll<T>(key);
    items.push(item);
    localStorage.setItem(key, JSON.stringify(items));
    return delay(item);
};
const update = async <T extends { id: string },>(key: string, updatedItem: T): Promise<T> => {
    let items = await getAll<T>(key);
    items = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    localStorage.setItem(key, JSON.stringify(items));
    return delay(updatedItem);
};

// --- DOMAIN-SPECIFIC API ---

// Users
export const getUsers = () => getAll<User>(DB.users);

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>, pass: string) => {
    const users = await getAll<User>(DB.users);
    if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists.');
    }

    const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };

    await create<User>(DB.users, newUser);

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    passwords[newUser.email] = pass;
    localStorage.setItem('user_passwords', JSON.stringify(passwords));

    return delay(newUser);
};

export const updateUser = (updatedUser: User) => update<User>(DB.users, updatedUser);

export const deleteUser = async (userId: string) => {
    let users = await getAll<User>(DB.users);
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) throw new Error('User not found');

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(DB.users, JSON.stringify(updatedUsers));

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    delete passwords[userToDelete.email];
    localStorage.setItem('user_passwords', JSON.stringify(passwords));

    return delay(null);
};

export const resetPassword = async (userId: string, newPassword: string) => {
    const users = await getAll<User>(DB.users);
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
        throw new Error('User not found.');
    }

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    passwords[userToUpdate.email] = newPassword;
    localStorage.setItem('user_passwords', JSON.stringify(passwords));

    return delay({ success: true });
};


// Courses
export const getCourses = () => getAll<Course>(DB.courses);
export const createCourse = (courseData: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
        ...courseData,
        id: `course-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    return create(DB.courses, newCourse);
};

// Quizzes
export const getQuizzesByCourse = async (courseId: string) => {
    const allQuizzes = await getAll<Quiz>(DB.quizzes);
    return delay(allQuizzes.filter(q => q.courseId === courseId));
};
export const getQuizById = (quizId: string) => getById<Quiz>(DB.quizzes, quizId);
export const createQuiz = (quizData: Omit<Quiz, 'id' | 'createdAt'>) => {
    const newQuiz: Quiz = {
        ...quizData,
        id: `quiz-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    return create(DB.quizzes, newQuiz);
};

// Quiz Attempts
export const submitQuizAttempt = (attemptData: Omit<QuizAttempt, 'id' | 'submittedAt'>) => {
    const newAttempt: QuizAttempt = {
        ...attemptData,
        id: `attempt-${Date.now()}`,
        submittedAt: new Date().toISOString(),
    };
    return create(DB.attempts, newAttempt);
};
export const getStudentProgress = async (studentId: string) => {
    const allAttempts = await getAll<QuizAttempt>(DB.attempts);
    return delay(allAttempts.filter(a => a.studentId === studentId));
};
export const getAllAttempts = () => getAll<QuizAttempt>(DB.attempts);


// --- AI QUIZ GENERATION ---
export const generateQuizQuestions = async (topic: string, difficulty: string, numQuestions: number): Promise<Question[]> => {
    const prompt = `Generate ${numQuestions} quiz questions about "${topic}" for a learning platform. The difficulty level should be "${difficulty}". 
    Include a mix of multiple-choice and short-answer questions. For multiple-choice, provide 4 options. 
    Ensure the response strictly follows the provided JSON schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['multiple-choice', 'short-answer'], description: 'The type of question.' },
                                    question: { type: Type.STRING, description: 'The question text.' },
                                    options: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING },
                                        description: 'An array of 4 possible answers for multiple-choice questions. Omit for short-answer.'
                                    },
                                    correctAnswer: { type: Type.STRING, description: 'The correct answer.' },
                                    points: { type: Type.INTEGER, description: 'Points awarded for a correct answer, typically 10.' },
                                },
                                required: ['type', 'question', 'correctAnswer', 'points'],
                            }
                        }
                    }
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        // Add IDs to the questions
        return result.questions.map((q: Omit<Question, 'id'>, index: number) => ({
            ...q,
            id: `gen-q-${Date.now()}-${index}`,
        }));

    } catch (error) {
        console.error("Error generating quiz questions with Gemini:", error);
        throw new Error("Failed to generate quiz questions. Please check your API key and try again.");
    }
};