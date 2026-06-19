import { create } from 'zustand';
import type { 
  CaseScene, 
  DialogueStep, 
  DialogueOption, 
  PracticeState,
  UserData,
  Feedback,
  StepResult,
  StepType,
  RecordTrainingResult,
  Student
} from '@/types';
import { 
  getUserData, 
  saveUserData, 
  addWrongAnswer, 
  addPracticeScore,
  addRecordTrainingResult,
  setCurrentStudent,
  getTeachingPointsByCategory,
  clearWrongAnswers as clearWrongAnswersStorage,
  clearUserData as clearUserDataStorage
} from '@/utils/storage';
import { determineMissingCategory } from '@/utils/scoring';

interface AppState {
  userData: UserData;
  practiceState: PracticeState;
  currentFeedback: Feedback | null;
  showFeedback: boolean;
  stepResults: StepResult[];
  lastOptionSelected: DialogueOption | null;
  hasAnsweredCurrentStep: boolean;
  
  loadUserData: () => void;
  startPractice: (caseData: CaseScene, steps: DialogueStep[]) => void;
  selectOption: (option: DialogueOption) => void;
  nextStep: () => void;
  prevStep: () => void;
  closeFeedback: () => void;
  reopenFeedback: () => void;
  completePractice: () => void;
  resetPractice: () => void;
  clearUserData: () => void;
  clearWrongAnswers: () => void;
  saveRecordResult: (result: Omit<RecordTrainingResult, 'id' | 'timestamp' | 'studentId' | 'studentName'>) => void;
  switchStudent: (studentId: string) => void;
  setCurrentStudentLocal: (student: Student) => void;
}

const initialPracticeState: PracticeState = {
  currentCase: null,
  currentStepIndex: 0,
  steps: [],
  selectedOptions: {},
  currentScore: 0,
  maxScore: 0,
  isCompleted: false,
  startTime: 0,
  lastFeedback: null
};

export const useAppStore = create<AppState>((set, get) => ({
  userData: getUserData(),
  practiceState: { ...initialPracticeState },
  currentFeedback: null,
  showFeedback: false,
  stepResults: [],
  lastOptionSelected: null,
  hasAnsweredCurrentStep: false,
  
  loadUserData: () => {
    set({ userData: getUserData() });
  },
  
  startPractice: (caseData: CaseScene, steps: DialogueStep[]) => {
    const maxScore = steps.reduce((sum, step) => {
      return sum + Math.max(...step.options.map(o => o.score));
    }, 0);
    
    set({
      practiceState: {
        currentCase: caseData,
        currentStepIndex: 0,
        steps,
        selectedOptions: {},
        currentScore: 0,
        maxScore,
        isCompleted: false,
        startTime: Date.now(),
        lastFeedback: null
      },
      stepResults: [],
      currentFeedback: null,
      showFeedback: false,
      lastOptionSelected: null,
      hasAnsweredCurrentStep: false
    });
  },
  
  selectOption: (option: DialogueOption) => {
    const { practiceState, stepResults, hasAnsweredCurrentStep } = get();
    
    if (hasAnsweredCurrentStep) return;
    
    const currentStep = practiceState.steps[practiceState.currentStepIndex];
    if (!currentStep) return;
    
    const newSelectedOptions = {
      ...practiceState.selectedOptions,
      [currentStep.id]: option
    };
    
    const newScore = practiceState.currentScore + option.score;
    
    const correctOption = currentStep.options.find(o => o.isCorrect);
    if (!option.isCorrect && correctOption && option.feedback.missingPoints.length > 0) {
      const missingCategory = determineMissingCategory(
        option.feedback.missingPoints,
        currentStep.stepName
      );
      
      const stepTypeMap: Record<string, StepType> = {
        greeting: 'opening',
        symptom: 'symptom_inquiry',
        guidance: 'care_guidance',
        followup: 'review_suggestion'
      };
      
      const teachingPoints = getTeachingPointsByCategory(missingCategory);
      
      addWrongAnswer({
        caseId: practiceState.currentCase!.id,
        caseTitle: practiceState.currentCase!.title,
        stepName: currentStep.stepName,
        stepType: stepTypeMap[currentStep.stepName] || 'other',
        selectedContent: option.content,
        correctContent: correctOption.content,
        missingCategory,
        missingPoints: option.feedback.missingPoints || [],
        score: option.score,
        feedback: option.feedback.explanation,
        selectedOption: option.content,
        correctOption: correctOption.content,
        teachingPoints
      });
    }
    
    const stepResult: StepResult = {
      stepName: currentStep.stepName,
      selectedOption: option,
      isCorrect: option.isCorrect,
      score: option.score,
      feedback: option.feedback
    };
    
    const newStepResults = [...stepResults, stepResult];
    
    set({
      practiceState: {
        ...practiceState,
        selectedOptions: newSelectedOptions,
        currentScore: newScore,
        lastFeedback: option.feedback
      },
      currentFeedback: option.feedback,
      showFeedback: true,
      stepResults: newStepResults,
      lastOptionSelected: option,
      hasAnsweredCurrentStep: true,
      userData: getUserData()
    });
  },
  
  nextStep: () => {
    const { practiceState } = get();
    const nextIndex = practiceState.currentStepIndex + 1;
    
    if (nextIndex < practiceState.steps.length) {
      set({
        practiceState: {
          ...practiceState,
          currentStepIndex: nextIndex
        },
        showFeedback: false,
        currentFeedback: null,
        hasAnsweredCurrentStep: false,
        lastOptionSelected: null
      });
    } else {
      get().completePractice();
    }
  },
  
  prevStep: () => {
    const { practiceState } = get();
    const prevIndex = practiceState.currentStepIndex - 1;
    
    if (prevIndex >= 0) {
      set({
        practiceState: {
          ...practiceState,
          currentStepIndex: prevIndex
        },
        hasAnsweredCurrentStep: false
      });
    }
  },
  
  closeFeedback: () => {
    set({ showFeedback: false });
  },
  
  reopenFeedback: () => {
    const { practiceState } = get();
    if (practiceState.lastFeedback) {
      set({ showFeedback: true, currentFeedback: practiceState.lastFeedback });
    }
  },
  
  completePractice: () => {
    const { practiceState } = get();
    const completionTime = Date.now() - practiceState.startTime;
    const correctRate = Math.round((practiceState.currentScore / practiceState.maxScore) * 100);
    
    addPracticeScore({
      caseId: practiceState.currentCase!.id,
      caseTitle: practiceState.currentCase!.title,
      totalScore: practiceState.currentScore,
      score: practiceState.currentScore,
      maxScore: practiceState.maxScore,
      correctRate,
      completionTime
    });
    
    set({
      practiceState: {
        ...practiceState,
        isCompleted: true
      },
      userData: getUserData()
    });
  },
  
  resetPractice: () => {
    set({
      practiceState: { ...initialPracticeState },
      currentFeedback: null,
      showFeedback: false,
      stepResults: [],
      lastOptionSelected: null,
      hasAnsweredCurrentStep: false
    });
  },
  
  clearUserData: () => {
    clearUserDataStorage();
    set({ userData: getUserData() });
  },
  
  clearWrongAnswers: () => {
    clearWrongAnswersStorage();
    set({ userData: getUserData() });
  },
  
  saveRecordResult: (result) => {
    addRecordTrainingResult(result);
    set({ userData: getUserData() });
  },
  
  switchStudent: (studentId) => {
    setCurrentStudent(studentId);
    set({ userData: getUserData() });
  },
  
  setCurrentStudentLocal: (student) => {
    const userData = getUserData();
    userData.currentStudentId = student.id;
    saveUserData(userData);
    set({ userData: getUserData() });
  }
}));

