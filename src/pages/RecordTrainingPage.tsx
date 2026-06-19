import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getCaseById } from '@/data/cases';
import { getRecordTemplateByCaseId } from '@/data/records';
import { calculateRecordScore, highlightDifferences } from '@/utils/textComparison';
import { getLastRecordTrainingResult } from '@/utils/storage';
import { getSectionName } from '@/utils/statistics';
import { useAppStore } from '@/store/appStore';
import type { PatientAnswer, RecordTrainingResult } from '@/types';

export default function RecordTrainingPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const saveRecordResult = useAppStore(state => state.saveRecordResult);
  
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [userRecord, setUserRecord] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof calculateRecordScore> | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [lastRecord, setLastRecord] = useState<RecordTrainingResult | null>(null);
  const [showLastRecord, setShowLastRecord] = useState(false);
  const [showLastReference, setShowLastReference] = useState(false);
  
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
      const saved = getLastRecordTrainingResult(caseId);
      setLastRecord(saved);
    } else {
      setLastRecord(null);
    }
  }, [caseId]);
  
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
    
    const updatedLastRecord = getLastRecordTrainingResult(caseId!);
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] py-8">
      <div className="max-w-7xl mx-auto px-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}
