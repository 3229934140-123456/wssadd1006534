import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  AlertTriangle, 
  Star, 
  CheckCircle2, 
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { getCaseById } from '@/data/cases';
import { getDialoguesByCaseId } from '@/data/dialogues';
import { useAppStore } from '@/store/appStore';
import { getStepNameChinese } from '@/utils/scoring';
import type { DialogueOption, StepName } from '@/types';

export default function PracticePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  
  const {
    practiceState,
    currentFeedback,
    showFeedback,
    stepResults,
    hasAnsweredCurrentStep,
    lastOptionSelected,
    startPractice,
    selectOption,
    nextStep,
    closeFeedback,
    reopenFeedback,
    resetPractice
  } = useAppStore();
  
  const caseData = caseId ? getCaseById(caseId) : undefined;
  const dialogues = caseId ? getDialoguesByCaseId(caseId) : [];
  
  useEffect(() => {
    if (caseData && dialogues.length > 0) {
      startPractice(caseData, dialogues);
    }
    
    return () => {
      resetPractice();
    };
  }, [caseId, caseData, dialogues]);
  
  const currentStep = practiceState.steps[practiceState.currentStepIndex];
  const isLastStep = practiceState.currentStepIndex === practiceState.steps.length - 1;
  const completedSteps = useMemo(() => {
    return Object.keys(practiceState.selectedOptions).map(stepId => {
      return practiceState.steps.findIndex(s => s.id === stepId);
    }).filter(i => i >= 0);
  }, [practiceState.selectedOptions, practiceState.steps]);
  
  const stepNames = practiceState.steps.map(s => s.stepName) as StepName[];
  
  const correctRate = practiceState.maxScore > 0
    ? Math.round((practiceState.currentScore / practiceState.maxScore) * 100)
    : 0;
  
  const handleSelectOption = (option: DialogueOption) => {
    if (hasAnsweredCurrentStep) return;
    selectOption(option);
  };
  
  const handleReopenFeedback = () => {
    reopenFeedback();
  };

  const handleNext = () => {
    nextStep();
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleRetry = () => {
    if (caseData && dialogues.length > 0) {
      startPractice(caseData, dialogues);
    }
  };
  
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' };
  };
  
  if (!caseData || !currentStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (practiceState.isCompleted) {
    const scoreGrade = getScoreGrade(correctRate);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">练习完成！</h1>
            <p className="text-gray-600">恭喜您完成了「{caseData.title}」的话术练习</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${scoreGrade.bg} flex items-center justify-center`}>
                  <span className={`text-4xl font-bold ${scoreGrade.color}`}>{scoreGrade.grade}</span>
                </div>
                <p className="text-gray-500 text-sm">综合评级</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {practiceState.currentScore}<span className="text-xl">/{practiceState.maxScore}</span>
                  </span>
                </div>
                <p className="text-gray-500 text-sm">总得分</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600">{correctRate}%</span>
                </div>
                <p className="text-gray-500 text-sm">正确率</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="Card mb-8"
          >
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-800">各步骤详情</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stepResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl border-2 ${
                      result.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {result.isCorrect 
                          ? <CheckCircle2 className="w-5 h-5 text-white" />
                          : <XCircle className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={result.isCorrect ? 'success' : 'danger'} size="sm">
                            {getStepNameChinese(result.stepName)}
                          </Badge>
                          <span className={`text-sm font-medium ${
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.score} 分
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">您的选择：</span>
                          {result.selectedOption.content}
                        </p>
                        {!result.isCorrect && (
                          <p className="text-sm text-green-700 bg-green-100 p-3 rounded-lg">
                            <span className="font-medium">正确参考：</span>
                            {result.feedback.correctSpeech}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <Home className="w-4 h-4" />
              返回首页
            </Button>
            <Button variant="secondary" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              重新练习
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/record/${caseId}`)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              开始记录训练
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <Target className="w-4 h-4 text-[#1A73E8]" />
              <span className="text-sm font-medium text-gray-700">
                {practiceState.currentScore}/{practiceState.maxScore}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{correctRate}%</span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <StepIndicator
            steps={stepNames}
            currentStep={practiceState.currentStepIndex}
            completedSteps={completedSteps}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex items-center gap-3 pb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-50">
                  <img
                    src={caseData.avatar}
                    alt={caseData.patientName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{caseData.patientName}</h3>
                  <p className="text-sm text-gray-500">{caseData.age}岁</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <User className="w-4 h-4" />
                    <span>患者性格</span>
                  </div>
                  <p className="text-sm text-gray-700">{caseData.patientPersonality}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>洁治记录</span>
                  </div>
                  <p className="text-sm text-gray-700">{caseData.cleaningRecord}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>关键风险点</span>
                  </div>
                  <div className="space-y-2">
                    {caseData.riskPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="info" size="md">
                      第 {practiceState.currentStepIndex + 1} 步 / 共 {practiceState.steps.length} 步
                    </Badge>
                    <Badge variant="primary" size="md">
                      {getStepNameChinese(currentStep.stepName)}
                    </Badge>
                    {hasAnsweredCurrentStep && lastOptionSelected && (
                      <Badge 
                        variant={lastOptionSelected.isCorrect ? 'success' : 'danger'} 
                        size="md"
                        className="gap-1"
                      >
                        {lastOptionSelected.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {lastOptionSelected.isCorrect ? '回答正确' : '回答错误'}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{currentStep.instruction}</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {currentStep.options.map((option, index) => {
                        const isSelected = lastOptionSelected?.id === option.id;
                        
                        return (
                          <motion.button
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleSelectOption(option)}
                            disabled={hasAnsweredCurrentStep}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                              hasAnsweredCurrentStep
                                ? option.isCorrect
                                  ? 'bg-green-50 border-green-400 cursor-default'
                                  : isSelected
                                    ? 'bg-red-50 border-red-400 cursor-default shadow-lg'
                                    : 'bg-white border-gray-200 cursor-default opacity-50'
                                : 'bg-white border-gray-200 hover:border-[#1A73E8] hover:bg-blue-50/50 cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                                hasAnsweredCurrentStep
                                  ? option.isCorrect
                                    ? 'bg-green-500 text-white'
                                    : isSelected
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-600'
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-[#1A73E8] group-hover:text-white'
                              }`}>
                                {hasAnsweredCurrentStep && option.isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : hasAnsweredCurrentStep && isSelected ? (
                                  <XCircle className="w-5 h-5" />
                                ) : (
                                  String.fromCharCode(65 + index)
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`leading-relaxed ${
                                  hasAnsweredCurrentStep && option.isCorrect
                                    ? 'text-green-800 font-medium'
                                    : hasAnsweredCurrentStep && isSelected
                                      ? 'text-red-800'
                                      : 'text-gray-700'
                                }`}>
                                  {option.content}
                                </p>
                                {!hasAnsweredCurrentStep && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                      得分: {option.score} 分
                                    </span>
                                  </div>
                                )}
                                {hasAnsweredCurrentStep && isSelected && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-xs font-medium ${
                                      lastOptionSelected?.isCorrect ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      得分: {option.score} 分
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {hasAnsweredCurrentStep && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 pt-6 border-t border-gray-200"
                      >
                        <div className="flex justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={handleReopenFeedback}
                            className="gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            查看反馈
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleNext}
                            className="gap-2"
                          >
                            {isLastStep ? '查看最终结果' : '下一步'}
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      <FeedbackModal
        isOpen={showFeedback}
        feedback={currentFeedback}
        stepName={currentStep.stepName}
        onClose={closeFeedback}
      />
    </div>
  );
}
