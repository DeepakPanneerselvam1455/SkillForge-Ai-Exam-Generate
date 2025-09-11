
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'mentor' | 'admin';
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mentorId: string;
  topics: string[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  createdBy: string; // mentorId
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: { [questionId: string]: string };
  score: number;
  totalPoints: number;
  submittedAt: string;
}
