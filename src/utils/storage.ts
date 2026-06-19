import type { UserData, WrongAnswer, PracticeScore } from '@/types';

const STORAGE_KEY = 'dental-followup-training-data';

const defaultUserData: UserData = {
  id: 'user-' + Date.now(),
  name: '学员',
  role: 'student',
  practiceScores: [],
  wrongAnswers: []
};

export const getUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
  return { ...defaultUserData, id: 'user-' + Date.now() };
};

export const saveUserData = (data: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
};

export const addWrongAnswer = (wrongAnswer: Omit<WrongAnswer, 'id' | 'timestamp'>): void => {
  const userData = getUserData();
  const newWrongAnswer: WrongAnswer = {
    ...wrongAnswer,
    id: 'wrong-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  userData.wrongAnswers.unshift(newWrongAnswer);
  saveUserData(userData);
};

export const addPracticeScore = (score: Omit<PracticeScore, 'timestamp'>): void => {
  const userData = getUserData();
  const newScore: PracticeScore = {
    ...score,
    timestamp: Date.now()
  };
  userData.practiceScores.unshift(newScore);
  saveUserData(userData);
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getBestScoreForCase = (caseId: string): number | null => {
  const userData = getUserData();
  const caseScores = userData.practiceScores.filter(s => s.caseId === caseId);
  if (caseScores.length === 0) return null;
  return Math.max(...caseScores.map(s => s.totalScore));
};

export const isCaseCompleted = (caseId: string): boolean => {
  const userData = getUserData();
  return userData.practiceScores.some(s => s.caseId === caseId);
};
