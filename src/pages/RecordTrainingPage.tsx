import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  MessageCircle, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  FileText,
  AlertCircle,
  Award,
  Home,
  Clock,
  History,
  BookOpen,
  MessageSquare,
  X,
  CheckCheck,
  ListTodo
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getCaseById } from '@/data/cases';
import { getRecordTemplateByCaseId } from '@/data/records';
import { calculateRecordScore, highlightDifferences } from '@/utils/textComparison';
import { 
  getLastRecordTrainingResult,
  getLatestUnseenComment,
  markCommentAsSeen,
  markCommentAsFollowedUp,
  getRecordTrainingResultsByCase
} from '@/utils/storage';
import { getSectionName } from '@/utils/statistics';
import { useAppStore } from '@/store/appStore';
import type { PatientAnswer, RecordTrainingResult, TeacherComment } from '@/types';

export default function RecordTrainingPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const saveRecordResult = useAppStore(state => state.saveRecordResult);
  const userData = useAppStore(state => state.userData);
  const recordTrainingFilterStudentId = useAppStore(state => state.recordTrainingFilterStudentId);
  const setRecordTrainingFilterStudentId = useAppStore(state => state.setRecordTrainingFilterStudentId);
  
  const urlStudentId = searchParams.get('studentId');
  const effectiveStudentId = urlStudentId || recordTrainingFilterStudentId || userData.currentStudentId;
  
  const currentStudent = useMemo(() => {
    return userData.students.find(s => s.id === effectiveStudentId) || userData.students.find(s => s.id === userData.currentStudentId);
  }, [userData, effectiveStudentId]);
  
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [userRecord, setUserRecord] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof calculateRecordScore> | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [lastRecord, setLastRecord] = useState<RecordTrainingResult | null>(null);
  const [showLastRecord, setShowLastRecord] = useState(false);
  const [showLastReference, setShowLastReference] = useState(false);
  const [latestComment, setLatestComment] = useState<TeacherComment | null>(null);
  const [showCommentAlert, setShowCommentAlert] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingFollowUpComment, setPendingFollowUpComment] = useState<TeacherComment | null>(null);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<RecordTrainingResult | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  
  const historyRecords = useMemo(() => {
    if (!caseId || !effectiveStudentId) return [];
    return getRecordTrainingResultsByCase(caseId, effectiveStudentId);
  }, [caseId, effectiveStudentId]);

  useEffect(() => {
    if (urlStudentId) {
      setRecordTrainingFilterStudentId(urlStudentId);
    }
  }, [urlStudentId, setRecordTrainingFilterStudentId]);
  
  const caseData = caseId ? getCaseById(caseId) : undefined;
  const recordTemplate = caseId ? getRecordTemplateByCaseId(caseId) : undefined;
  
  useEffect(() => {
    setCurrentAnswerIndex(0);
    setUserRecord('');
    setIsSubmitted(false);
    setScoreResult(null);
    setShowReference(false);
    setShowLastRecord(false);
    setShowLastReference(false);
    if (caseId) {
      const saved = getLastRecordTrainingResult(caseId, currentStudent?.id);
      setLastRecord(saved);
    } else {
      setLastRecord(null);
    }
  }, [caseId, currentStudent?.id]);
  
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

  const handleViewHistoryRecord = (record: RecordTrainingResult) => {
    setSelectedHistoryRecord(record);
    setShowHistoryDetail(true);
  };

  const handleCloseHistoryDetail = () => {
    setShowHistoryDetail(false);
    setSelectedHistoryRecord(null);
  };
  
  if (!caseData || !recordTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  const allAnswers = recordTemplate.patientAnswers;
  const currentAnswer = allAnswers[currentAnswerIndex];
  const isLastAnswer = currentAnswerIndex === allAnswers.length - 1;
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleNextAnswer = () => {
    if (currentAnswerIndex < allAnswers.length - 1) {
      setCurrentAnswerIndex(prev => prev + 1);
    }
  };
  
  const handlePrevAnswer = () => {
    if (currentAnswerIndex > 0) {
      setCurrentAnswerIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = () => {
    if (!userRecord.trim()) {
      alert('请先填写随访记录');
      return;
    }
    
    const result = calculateRecordScore(
      userRecord,
      recordTemplate.referenceRecord,
      recordTemplate.keyPoints
    );
    
    saveRecordResult({
      caseId: caseId!,
      caseTitle: caseData.title,
      userRecord,
      totalScore: result.totalScore,
      keywordScore: result.keywordScore,
      textSimilarity: result.textSimilarity,
      structureScore: result.structureScore,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      missingSections: result.missingSections
    });
    
    const updatedLastRecord = getLastRecordTrainingResult(caseId!, currentStudent?.id);
    setLastRecord(updatedLastRecord);
    setScoreResult(result);
    setIsSubmitted(true);
  };
  
  const handleReset = () => {
    setUserRecord('');
    setIsSubmitted(false);
    setScoreResult(null);
    setShowReference(false);
  };
  
  const handleToggleReference = () => {
    setShowReference(!showReference);
  };
  
  const handleViewLastRecord = () => {
    setShowLastRecord(true);
    setShowLastReference(false);
  };
  
  const handleViewLastReference = () => {
    setShowLastReference(true);
    setShowLastRecord(false);
  };
  
  const handleCloseLastRecord = () => {
    setShowLastRecord(false);
    setShowLastReference(false);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };
  
  const { userHighlighted, referenceHighlighted } = scoreResult 
    ? highlightDifferences(userRecord, recordTemplate.referenceRecord)
    : { userHighlighted: '', referenceHighlighted: '' };
  
  const lastUserHighlighted = lastRecord && (showLastRecord || showLastReference)
    ? highlightDifferences(lastRecord.userRecord, recordTemplate.referenceRecord).userHighlighted
    : '';
  
  const lastReferenceHighlighted = lastRecord && (showLastRecord || showLastReference)
    ? highlightDifferences(lastRecord.userRecord, recordTemplate.referenceRecord).referenceHighlighted
    : '';

  const historyUserHighlighted = selectedHistoryRecord && showHistoryDetail
    ? highlightDifferences(selectedHistoryRecord.userRecord, recordTemplate.referenceRecord).userHighlighted
    : '';

  const historyReferenceHighlighted = selectedHistoryRecord && showHistoryDetail
    ? highlightDifferences(selectedHistoryRecord.userRecord, recordTemplate.referenceRecord).referenceHighlighted
    : '';
  
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">随访记录训练</h1>
            <p className="text-sm text-gray-500">{caseData.title}</p>
          </div>
          
          <div className="w-24" />
        </div>
        
        <AnimatePresence>
          {lastRecord && !isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                        <History className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          上次练习记录
                          <Badge variant="warning" size="sm">历史</Badge>
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(lastRecord.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(lastRecord.totalScore)}`}>
                          {lastRecord.totalScore}
                        </div>
                        <p className="text-xs text-gray-500">上次得分</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleViewLastRecord}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          查看上次内容
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleViewLastReference}
                          className="gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          查看参考写法
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {lastRecord && (showLastRecord || showLastReference) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card className="border-amber-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <History className="w-5 h-5 text-amber-500" />
                      上次记录对比分析
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleCloseLastRecord}>
                      收起
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-blue-600">{lastRecord.keywordScore}%</p>
                      <p className="text-xs text-gray-600">关键词匹配</p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-green-600">{lastRecord.textSimilarity}%</p>
                      <p className="text-xs text-gray-600">文本相似度</p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-purple-600">{lastRecord.structureScore}%</p>
                      <p className="text-xs text-gray-600">结构完整度</p>
                    </div>
                  </div>
                  
                  {lastRecord.missingSections.length > 0 && (
                    <div className="mb-5 p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-sm font-medium text-red-700 mb-2">上次缺少的结构：</p>
                      <div className="flex flex-wrap gap-2">
                        {lastRecord.missingSections.map((section, index) => (
                          <Badge key={index} variant="danger" size="sm">
                            {getSectionName(section)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <h4 className="font-bold text-gray-800 text-sm">上次您的记录</h4>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: lastUserHighlighted }}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <h4 className="font-bold text-gray-800 text-sm">参考写法</h4>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: lastReferenceHighlighted }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">标注说明</p>
                        <p className="text-sm text-yellow-700">
                          <span className="bg-red-100 text-red-700 px-1 rounded">红色</span> 表示您记录中有但参考中没有的内容，
                          <span className="bg-green-100 text-green-700 px-1 rounded">绿色</span> 表示参考中有但您遗漏的内容。
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#1A73E8]" />
                    患者对话记录
                  </h2>
                  <Badge variant="info" size="sm">
                    {currentAnswerIndex + 1} / {allAnswers.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAnswerIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-blue-100 text-blue-800 px-4 py-3 rounded-2xl rounded-bl-none">
                        <p className="text-sm font-medium text-blue-600 mb-1">洁牙师</p>
                        <p className="text-sm">{currentAnswer.question}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-br-none shadow-sm">
                        <p className="text-sm font-medium text-gray-600 mb-1">{caseData.patientName}</p>
                        <p className="text-sm text-gray-800">{currentAnswer.answer}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevAnswer}
                    disabled={currentAnswerIndex === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    上一条
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNextAnswer}
                    disabled={isLastAnswer}
                    className="gap-2"
                  >
                    下一条
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1A73E8]" />
                  全部对话回顾
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {allAnswers.map((item: PatientAnswer, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-xl ${
                        index === currentAnswerIndex 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">对话 {index + 1}</p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">患者回答：</span>
                        {item.answer.length > 60 ? item.answer.slice(0, 60) + '...' : item.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#34A853]" />
                    请撰写随访记录
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{userRecord.length}</span>
                    <span>字</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <textarea
                  value={userRecord}
                  onChange={(e) => setUserRecord(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="请根据以上对话内容，整理成规范的随访记录。包括：患者基本信息、主诉、现病史、口腔检查、指导内容、复诊建议等。"
                  className={`flex-1 w-full p-4 border-2 rounded-2xl resize-none focus:outline-none focus:border-[#1A73E8] transition-colors ${
                    isSubmitted ? 'bg-gray-50' : 'bg-white'
                  }`}
                  rows={15}
                />
                
                {!isSubmitted && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2 flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      清空重写
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      className="gap-2 flex-1"
                    >
                      <Send className="w-4 h-4" />
                      提交记录
                    </Button>
                  </div>
                )}
                
                {isSubmitted && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2 flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新练习
                    </Button>
                    <Button
                      variant={showReference ? 'secondary' : 'primary'}
                      onClick={handleToggleReference}
                      className="gap-2 flex-1"
                    >
                      {showReference ? '隐藏参考' : '查看参考写法'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <AnimatePresence>
          {isSubmitted && scoreResult && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="mt-8 space-y-6"
            >
              <Card className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${getScoreBg(scoreResult.totalScore)} flex flex-col items-center justify-center shadow-lg`}
                      >
                        <Award className="w-8 h-8 text-white mb-1" />
                        <span className="text-3xl font-bold">{scoreResult.totalScore}</span>
                        <span className="text-xs text-white/80">综合得分</span>
                      </motion.div>
                      
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">
                          {scoreResult.totalScore >= 80 ? '太棒了！记录很规范' : 
                           scoreResult.totalScore >= 60 ? '做得不错，还有提升空间' : 
                           '需要加强练习哦'}
                        </h3>
                        <p className="text-blue-100">
                          继续努力，掌握规范的随访记录格式对临床工作非常重要
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-white/10 rounded-xl p-4">
                        <p className="text-2xl font-bold">{scoreResult.keywordScore}%</p>
                        <p className="text-xs text-blue-100">关键词匹配</p>
                      </div>
                      <div className="text-center bg-white/10 rounded-xl p-4">
                        <p className="text-2xl font-bold">{scoreResult.textSimilarity}%</p>
                        <p className="text-xs text-blue-100">文本相似度</p>
                      </div>
                      <div className="text-center bg-white/10 rounded-xl p-4">
                        <p className="text-2xl font-bold">{scoreResult.structureScore}%</p>
                        <p className="text-xs text-blue-100">结构完整度</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      已包含的关键点
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {scoreResult.matchedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {scoreResult.matchedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="success" size="sm">
                            {keyword.length > 12 ? keyword.slice(0, 12) + '...' : keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">暂未匹配到关键点</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      遗漏的关键点
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {scoreResult.missingKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {scoreResult.missingKeywords.map((keyword, index) => (
                          <Badge key={index} variant="danger" size="sm">
                            {keyword.length > 12 ? keyword.slice(0, 12) + '...' : keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-600 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        太棒了！所有关键点都已包含
                      </p>
                    )}
                    
                    {scoreResult.missingSections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">缺少的结构：</p>
                        <div className="flex flex-wrap gap-2">
                          {scoreResult.missingSections.map((section, index) => (
                            <Badge key={index} variant="warning" size="sm">
                              {getSectionName(section)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <AnimatePresence>
                {showReference && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <h3 className="font-bold text-gray-800">您的记录</h3>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: userHighlighted }}
                          />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <h3 className="font-bold text-gray-800">参考写法</h3>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: referenceHighlighted }}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-gray-800">{currentStudent?.name || '该学员'}的历史记录</h3>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {historyRecords.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {historyRecords.map((record, index) => (
                                <motion.div
                                  key={record.id}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  onClick={() => handleViewHistoryRecord(record)}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                    selectedHistoryRecord?.id === record.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">
                                      {formatTime(record.timestamp)}
                                    </span>
                                    <span className={`font-bold ${getScoreColor(record.totalScore)}`}>
                                      {record.totalScore}分
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>关键词 {record.keywordScore}%</span>
                                    <span>·</span>
                                    <span>相似度 {record.textSimilarity}%</span>
                                    <span>·</span>
                                    <span>结构 {record.structureScore}%</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm">暂无历史记录</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">标注说明</p>
                          <p className="text-sm text-yellow-700">
                            <span className="bg-red-100 text-red-700 px-1 rounded">红色</span> 表示您记录中有但参考中没有的内容，
                            <span className="bg-green-100 text-green-700 px-1 rounded">绿色</span> 表示参考中有但您遗漏的内容。
                          </p>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showHistoryDetail && selectedHistoryRecord && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-6"
                        >
                          <Card className="border-blue-200 bg-blue-50/30">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <History className="w-5 h-5 text-blue-500" />
                                  <h3 className="font-bold text-gray-800">
                                    历史记录详情 - {formatTime(selectedHistoryRecord.timestamp)}
                                  </h3>
                                  <Badge className={getScoreColor(selectedHistoryRecord.totalScore)} size="sm">
                                    {selectedHistoryRecord.totalScore}分
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleCloseHistoryDetail}>
                                  收起
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                                  <p className="text-2xl font-bold text-blue-600">{selectedHistoryRecord.keywordScore}%</p>
                                  <p className="text-xs text-gray-600">关键词匹配</p>
                                </div>
                                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                  <p className="text-2xl font-bold text-green-600">{selectedHistoryRecord.textSimilarity}%</p>
                                  <p className="text-xs text-gray-600">文本相似度</p>
                                </div>
                                <div className="text-center bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4">
                                  <p className="text-2xl font-bold text-purple-600">{selectedHistoryRecord.structureScore}%</p>
                                  <p className="text-xs text-gray-600">结构完整度</p>
                                </div>
                              </div>
                              
                              {selectedHistoryRecord.missingSections.length > 0 && (
                                <div className="mb-5 p-4 bg-red-50 rounded-xl border border-red-100">
                                  <p className="text-sm font-medium text-red-700 mb-2">缺少的结构：</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedHistoryRecord.missingSections.map((section, index) => (
                                      <Badge key={index} variant="danger" size="sm">
                                        {getSectionName(section)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <h4 className="font-bold text-gray-800 text-sm">当时记录</h4>
                                  </CardHeader>
                                  <CardContent>
                                    <div 
                                      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                                      dangerouslySetInnerHTML={{ __html: historyUserHighlighted }}
                                    />
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardHeader>
                                    <h4 className="font-bold text-gray-800 text-sm">参考写法</h4>
                                  </CardHeader>
                                  <CardContent>
                                    <div 
                                      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                                      dangerouslySetInnerHTML={{ __html: historyReferenceHighlighted }}
                                    />
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800 mb-1">标注说明</p>
                                    <p className="text-sm text-yellow-700">
                                      <span className="bg-red-100 text-red-700 px-1 rounded">红色</span> 表示记录中有但参考中没有的内容，
                                      <span className="bg-green-100 text-green-700 px-1 rounded">绿色</span> 表示参考中有但遗漏的内容。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {pendingFollowUpComment && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
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
                                完成记录训练后，请标记已跟进老师的批注要求
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
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                  <Home className="w-4 h-4" />
                  返回首页
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/practice/${caseId}`)}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  复习话术练习
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
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
