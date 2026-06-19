export type StepName = 'greeting' | 'symptom' | 'guidance' | 'followup';

export type StepType = 'opening' | 'symptom_inquiry' | 'care_guidance' | 'review_suggestion' | 'other';

export type MissingCategory = 
  | 'brushing' 
  | 'floss' 
  | 'sensitivity' 
  | 'recheck' 
  | 'diet' 
  | 'hygiene' 
  | 'symptom' 
  | 'emotional' 
  | 'other';

export type FeedbackType = 'correct' | 'warning' | 'error';

export type UserRole = 'student' | 'teacher';

export type RecordSection = 'basic_info' | 'chief_complaint' | 'present_illness' | 'oral_exam' | 'guidance' | 'recheck_plan';

export interface CaseScene {
  id: string;
  title: string;
  description: string;
  patientName: string;
  age: number;
  patientPersonality: string;
  cleaningRecord: string;
  riskPoints: string[];
  difficulty: 1 | 2 | 3;
  avatar: string;
  completed?: boolean;
  bestScore?: number;
}

export interface DialogueOption {
  id: string;
  content: string;
  isCorrect: boolean;
  score: number;
  feedback: Feedback;
}

export interface DialogueStep {
  id: string;
  caseId: string;
  stepOrder: number;
  stepName: StepName;
  instruction: string;
  options: DialogueOption[];
}

export interface Feedback {
  type: FeedbackType;
  missingPoints: string[];
  correctSpeech: string;
  explanation: string;
  teachingPoints?: string[];
}

export interface PatientAnswer {
  question: string;
  answer: string;
}

export interface RecordTemplate {
  caseId: string;
  patientAnswers: PatientAnswer[];
  referenceRecord: string;
  keyPoints: string[];
  requiredSections: RecordSection[];
}

export interface RecordTrainingResult {
  id: string;
  caseId: string;
  caseTitle: string;
  userRecord: string;
  totalScore: number;
  keywordScore: number;
  textSimilarity: number;
  structureScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSections: RecordSection[];
  studentId: string;
  studentName: string;
  timestamp: number;
}

export interface WrongAnswer {
  id: string;
  caseId: string;
  caseTitle: string;
  stepName: StepName;
  stepType: StepType;
  selectedContent: string;
  correctContent: string;
  missingCategory: MissingCategory;
  score: number;
  feedback: string;
  selectedOption: string;
  correctOption: string;
  teachingPoints: string[];
  studentId: string;
  studentName: string;
  timestamp: number;
}

export interface PracticeScore {
  caseId: string;
  caseTitle: string;
  totalScore: number;
  score: number;
  maxScore: number;
  correctRate: number;
  completionTime: number;
  studentId: string;
  studentName: string;
  timestamp: number;
}

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  joinDate: number;
  isActive: boolean;
}

export interface UserData {
  id: string;
  name: string;
  role: UserRole;
  practiceScores: PracticeScore[];
  wrongAnswers: WrongAnswer[];
  recordTrainingResults: RecordTrainingResult[];
  currentStudentId: string;
  students: Student[];
}

export interface PracticeState {
  currentCase: CaseScene | null;
  currentStepIndex: number;
  steps: DialogueStep[];
  selectedOptions: Record<string, DialogueOption>;
  currentScore: number;
  maxScore: number;
  isCompleted: boolean;
  startTime: number;
  lastFeedback: Feedback | null;
}

export interface ReviewStats {
  totalPractices: number;
  averageCorrectRate: number;
  accuracyRate: number;
  wrongByCategory: Record<MissingCategory, number>;
  recentProgress: { date: string; correctRate: number }[];
  totalRecordTrainings: number;
  averageRecordScore: number;
  frequentMissingSections: Record<RecordSection, number>;
}

export interface CategoryReview {
  category: MissingCategory;
  categoryName: string;
  count: number;
  percentage: number;
  wrongAnswers: WrongAnswer[];
  teachingPoints: string[];
}

export interface StepResult {
  stepName: StepName;
  selectedOption: DialogueOption;
  isCorrect: boolean;
  score: number;
  feedback: Feedback;
}

