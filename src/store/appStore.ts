import { create } from 'zustand';
import type { 
  CaseScene, 
  DialogueStep, 
  DialogueOption, 
  PracticeState,
  UserData,
  Feedback,
  StepResult,
  StepType
} from '@/types';
import { getUserData, saveUserData, addWrongAnswer, addPracticeScore } from '@/utils/storage';
import { determineMissingCategory } from '@/utils/scoring';

interface AppState {
  userData: UserData;
  practiceState: PracticeState;
  currentFeedback: Feedback | null;
  showFeedback: boolean;
  stepResults: StepResult[];
  
  loadUserData: () => void;
  startPractice: (caseData: CaseScene, steps: DialogueStep[]) => void;
  selectOption: (option: DialogueOption) => void;
  nextStep: () => void;
  prevStep: () => void;
  closeFeedback: () => void;
  completePractice: () => void;
  resetPractice: () => void;
  clearUserData: () => void;
  clearWrongAnswers: () => void;
}

const initialPracticeState: PracticeState = {
  currentCase: null,
  currentStepIndex: 0,
  steps: [],
  selectedOptions: {},
  currentScore: 0,
  maxScore: 0,
  isCompleted: false,
  startTime: 0
};

export const useAppStore = create<AppState>((set, get) => ({
  userData: getUserData(),
  practiceState: { ...initialPracticeState },
  currentFeedback: null,
  showFeedback: false,
  stepResults: [],
  
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
        startTime: Date.now()
      },
      stepResults: [],
      currentFeedback: null,
      showFeedback: false
    });
  },
  
  selectOption: (option: DialogueOption) => {
    const { practiceState, stepResults } = get();
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
      
      addWrongAnswer({
        caseId: practiceState.currentCase!.id,
        caseTitle: practiceState.currentCase!.title,
        stepName: currentStep.stepName,
        stepType: stepTypeMap[currentStep.stepName] || 'other',
        selectedContent: option.content,
        correctContent: correctOption.content,
        missingCategory,
        score: option.score,
        feedback: option.feedback.explanation,
        selectedOption: option.content,
        correctOption: correctOption.content
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
        currentScore: newScore
      },
      currentFeedback: option.feedback,
      showFeedback: true,
      stepResults: newStepResults,
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
        currentFeedback: null
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
        }
      });
    }
  },
  
  closeFeedback: () => {
    set({ showFeedback: false });
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
      stepResults: []
    });
  },
  
  clearUserData: () => {
    localStorage.removeItem('dental-followup-training-data');
    set({ userData: getUserData() });
  },
  
  clearWrongAnswers: () => {
    const userData = getUserData();
    userData.wrongAnswers = [];
    saveUserData(userData);
    set({ userData });
  }
}));
