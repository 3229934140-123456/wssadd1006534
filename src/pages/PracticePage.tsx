import { useEffect, useMemo, useState } from 'react';
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
  Target,
  MessageSquare,
  X,
  CheckCheck,
  Clock,
  ListTodo
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
import { 
  getLatestUnseenComment, 
  markCommentAsSeen, 
  markCommentAsFollowedUp 
} from '@/utils/storage';
import type { DialogueOption, StepName, TeacherComment } from '@/types';

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
    resetPractice,
    userData
  } = useAppStore();
  
  const currentStudent = useMemo(() => {
    return userData.students.find(s => s.id === userData.currentStudentId);
  }, [userData]);
  
  const [latestComment, setLatestComment] = useState<TeacherComment | null>(null);
  const [showCommentAlert, setShowCommentAlert] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingFollowUpComment, setPendingFollowUpComment] = useState<TeacherComment | null>(null);
  
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
  
  useEffect(() => {
    if (caseId && currentStudent) {
      const comment = getLatestUnseenComment(currentStudent.id, caseId);
      if (comment) {
        setLatestComment(comment);
        setShowCommentAlert(true);
        setPendingFollowUpComment(comment);
      }
    }
  }, [caseId, currentStudent]);
  
  const formatCommentTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getContentSummary = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };
  
  const handleViewComment = () => {
    if (latestComment) {
      markCommentAsSeen(latestComment.id);
      setShowCommentModal(true);
    }
  };
  
  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setShowCommentAlert(false);
    setLatestComment(null);
  };
  
  const handleMarkFollowedUp = () => {
    if (pendingFollowUpComment) {
      markCommentAsFollowedUp(pendingFollowUpComment.id);
      setPendingFollowUpComment(null);
    }
  };
  
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
          
          <AnimatePresence>
            {pendingFollowUpComment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">老师批注待跟进</h3>
                          <p className="text-sm text-gray-600">
                            完成练习后，请标记已跟进老师的批注要求
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={handleMarkFollowedUp}
                        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0"
                      >
                        <CheckCheck className="w-4 h-4" />
                        标记改练已跟进
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
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
      <AnimatePresence>
        {showCommentAlert && latestComment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      老师有新批注：{getContentSummary(latestComment.content)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleViewComment}
                    className="bg-white text-amber-600 hover:bg-amber-50 border-0"
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
      
      <AnimatePresence>
        {showCommentModal && latestComment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleCloseCommentModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">老师批注详情</h3>
                    <p className="text-sm text-white/80">{latestComment.caseTitle}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCommentModal}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      创建时间
                    </h4>
                    <p className="text-gray-800">{formatCommentTime(latestComment.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      批注内容
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {latestComment.content}
                      </p>
                    </div>
                  </div>
                  
                  {latestComment.actionItems && latestComment.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <ListTodo className="w-4 h-4" />
                        待办要点
                      </h4>
                      <div className="space-y-2">
                        {latestComment.actionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-3 bg-amber-50 rounded-lg p-3">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-gray-800 text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  variant="primary"
                  onClick={handleCloseCommentModal}
                  className="w-full gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  我已了解
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
