import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Star, MessageCircle, FileText, AlertTriangle, Trophy, CheckCircle2, Target, BookOpen, Users, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, ClipboardList, UserCheck, Clock, CheckSquare, ListTodo } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cases } from '@/data/cases';
import { useAppStore } from '@/store/appStore';
import { getBestScoreForCase, isCaseCompleted, getPracticeCountByCase, getRecordCountByCase, getChecklistStatsForDate } from '@/utils/storage';
import { calculateReviewStats, generateTeacherWorkbenchData, getCategoryName } from '@/utils/statistics';
import type { MissingCategory } from '@/types';

const difficultyColors = {
  1: 'from-green-400 to-green-500',
  2: 'from-yellow-400 to-orange-500',
  3: 'from-red-400 to-red-500'
};

const difficultyLabels = {
  1: '入门',
  2: '进阶',
  3: '挑战'
};

const categoryColors: Record<MissingCategory, { bg: string; text: string; bar: string; ring: string }> = {
  brushing: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', ring: 'ring-blue-400' },
  floss: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500', ring: 'ring-green-400' },
  sensitivity: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500', ring: 'ring-purple-400' },
  recheck: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', ring: 'ring-orange-400' },
  diet: { bg: 'bg-pink-50', text: 'text-pink-700', bar: 'bg-pink-500', ring: 'ring-pink-400' },
  hygiene: { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500', ring: 'ring-cyan-400' },
  symptom: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500', ring: 'ring-red-400' },
  emotional: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500', ring: 'ring-yellow-400' },
  other: { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-500', ring: 'ring-gray-400' }
};

const categoryBadgeColors: Record<MissingCategory, string> = {
  brushing: 'bg-blue-100 text-blue-700',
  floss: 'bg-green-100 text-green-700',
  sensitivity: 'bg-purple-100 text-purple-700',
  recheck: 'bg-orange-100 text-orange-700',
  diet: 'bg-pink-100 text-pink-700',
  hygiene: 'bg-cyan-100 text-cyan-700',
  symptom: 'bg-red-100 text-red-700',
  emotional: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function HomePage() {
  const navigate = useNavigate();
  const { userData, setSelectedStudentId, setViewMode, setRecordTrainingFilterStudentId } = useAppStore();
  const [hoveredCase, setHoveredCase] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const checklistStats = useMemo(() => getChecklistStatsForDate(today), [today]);
  
  const stats = calculateReviewStats(
    userData.wrongAnswers,
    userData.practiceScores,
    userData.recordTrainingResults
  );
  
  const totalPractices = stats.totalPractices;
  const avgScore = totalPractices > 0
    ? Math.round(userData.practiceScores.reduce((sum, s) => sum + s.totalScore, 0) / totalPractices)
    : 0;
  const totalWrong = userData.wrongAnswers.length;
  const accuracyRate = stats.accuracyRate;
  const totalRecordTrainings = stats.totalRecordTrainings;
  const avgRecordScore = stats.averageRecordScore;
  
  const isTeacher = userData.role === 'teacher';
  const workbenchData = isTeacher ? generateTeacherWorkbenchData(
    userData.students || [],
    userData.wrongAnswers || [],
    userData.practiceScores || [],
    userData.recordTrainingResults || []
  ) : null;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  const handleStartPractice = (caseId: string) => {
    navigate(`/practice/${caseId}`);
  };
  
  const handleStartRecord = (caseId: string) => {
    navigate(`/record/${caseId}`);
  };

  const handleFocusStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setViewMode('individual');
    navigate(`/teacher?studentId=${studentId}&viewMode=individual`);
  };

  const handleRecordPerformanceClick = (caseId: string, studentId: string) => {
    setRecordTrainingFilterStudentId(studentId);
    navigate(`/record/${caseId}?studentId=${studentId}`);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            口腔随访沟通模拟训练
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            选择病例场景，练习洁治后的随访沟通技巧，系统即时反馈，帮助您快速提升临床沟通能力
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-12"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">总练习次数</p>
                  <p className="text-2xl md:text-3xl font-bold">{totalPractices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-green-100 text-xs md:text-sm">平均得分</p>
                  <p className="text-2xl md:text-3xl font-bold">{avgScore}<span className="text-sm md:text-lg">/100</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-orange-100 text-xs md:text-sm">错题总数</p>
                  <p className="text-2xl md:text-3xl font-bold">{totalWrong}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-cyan-100 text-xs md:text-sm">正确率</p>
                  <p className="text-2xl md:text-3xl font-bold">{accuracyRate}<span className="text-sm md:text-lg">%</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-purple-100 text-xs md:text-sm">记录训练次数</p>
                  <p className="text-2xl md:text-3xl font-bold">{totalRecordTrainings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-pink-100 text-xs md:text-sm">平均记录得分</p>
                  <p className="text-2xl md:text-3xl font-bold">{avgRecordScore}<span className="text-sm md:text-lg">/100</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {isTeacher && workbenchData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">老师工作台</h2>
                      <p className="text-sm text-gray-500">Teacher Workbench</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(workbenchData.date)}</span>
                  </div>
                </div>

                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ListTodo className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-800">今日讲评安排</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-500">已安排</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{checklistStats.selected}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-500">已完成</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{checklistStats.completed}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-500">待讲</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{checklistStats.remaining}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">完成进度</span>
                      <span className="font-medium text-gray-700">
                        {checklistStats.selected > 0 
                          ? Math.round((checklistStats.completed / checklistStats.selected) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                      {checklistStats.selected > 0 && (
                        <>
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(checklistStats.completed / checklistStats.selected) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-orange-400 transition-all"
                            style={{ width: `${(checklistStats.remaining / checklistStats.selected) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>已完成</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-400 rounded-full" />
                        <span>待讲</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-gray-800">今日讲评重点</h3>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="text-base font-bold text-gray-800">今日高频问题</h4>
                    <Badge variant="danger" size="sm">
                      {workbenchData.highFrequencyProblems.length} 项
                    </Badge>
                  </div>
                  
                  {workbenchData.highFrequencyProblems.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                      <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p>暂无高频问题，学员整体表现良好</p>
                    </div>
                  ) : (
                    <Link to="/review">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workbenchData.highFrequencyProblems.map((problem, index) => {
                          const colors = categoryColors[problem.category];
                          const maxCount = Math.max(...workbenchData.highFrequencyProblems.map(p => p.count), 1);
                          const progressWidth = (problem.count / maxCount) * 100;
                          
                          return (
                            <motion.div
                              key={problem.category}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + index * 0.05 }}
                              className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-gray-800 truncate">{problem.categoryName}</h5>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={categoryBadgeColors[problem.category]} size="sm">
                                      {problem.count} 次错误
                                    </Badge>
                                    <span className="text-xs text-gray-500">占比 {problem.percentage}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colors.bar} rounded-full transition-all`}
                                  style={{ width: `${progressWidth}%` }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </Link>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-5 h-5 text-orange-500" />
                    <h4 className="text-base font-bold text-gray-800">需要重点关注的学员</h4>
                    <Badge variant="warning" size="sm">
                      {workbenchData.focusStudents.length} 人
                    </Badge>
                  </div>
                  
                  {workbenchData.focusStudents.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                      <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p>暂无需要重点关注的学员</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workbenchData.focusStudents.map((focus, index) => {
                        const isLowScore = focus.recentScore < 60;
                        const isMediumScore = focus.recentScore >= 60 && focus.recentScore < 80;
                        const cardBgClass = isLowScore 
                          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' 
                          : isMediumScore 
                            ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200' 
                            : 'bg-white border-gray-200';
                        
                        return (
                          <div 
                            key={focus.student.id}
                            onClick={() => handleFocusStudentClick(focus.student.id)}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35 + index * 0.05 }}
                              className={`rounded-xl p-4 border ${cardBgClass} hover:shadow-md transition-all cursor-pointer`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                                  isLowScore 
                                    ? 'bg-red-100 text-red-600' 
                                    : isMediumScore 
                                      ? 'bg-orange-100 text-orange-600' 
                                      : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {focus.student.name.slice(0, 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-gray-800 truncate">{focus.student.name}</h5>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>错误 {focus.wrongCount} 次</span>
                                  </div>
                                </div>
                                <div className={`text-right ${
                                  isLowScore 
                                    ? 'text-red-600' 
                                    : isMediumScore 
                                      ? 'text-orange-600' 
                                      : 'text-green-600'
                                }`}>
                                  <p className="text-xl font-bold">{focus.recentScore || '-'}</p>
                                  <p className="text-xs opacity-70">平均分</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">最薄弱：</span>
                                <Badge className={categoryBadgeColors[focus.weakestCategory]} size="sm">
                                  {getCategoryName(focus.weakestCategory)}
                                </Badge>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h4 className="text-base font-bold text-gray-800">最近记录训练表现</h4>
                    <Badge variant="info" size="sm">
                      {workbenchData.recentRecordPerformance.length} 条
                    </Badge>
                  </div>
                  
                  {workbenchData.recentRecordPerformance.length === 0 || 
                   workbenchData.recentRecordPerformance.every(r => !r.lastRecord) ? (
                    <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                      <ClipboardList className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p>暂无记录训练数据</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workbenchData.recentRecordPerformance
                        .filter(r => r.lastRecord)
                        .map((record, index) => (
                          <div 
                            key={record.student.id}
                            onClick={() => handleRecordPerformanceClick(record.lastRecord!.caseId, record.student.id)}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + index * 0.05 }}
                              className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-medium text-purple-600">
                                  {record.student.name.slice(0, 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-gray-800 truncate">{record.student.name}</h5>
                                  <p className="text-xs text-gray-500 truncate">
                                    {record.lastRecord!.caseTitle}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-gray-800">
                                    {record.lastRecord!.totalScore}
                                  </p>
                                  <p className="text-xs text-gray-500">上次得分</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-1 text-sm font-medium ${
                                  record.improvement > 0 
                                    ? 'text-green-600' 
                                    : record.improvement < 0 
                                      ? 'text-red-600' 
                                      : 'text-gray-500'
                                }`}>
                                  {record.improvement > 0 ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                  ) : record.improvement < 0 ? (
                                    <ArrowDownRight className="w-4 h-4" />
                                  ) : null}
                                  <span>
                                    {record.improvement > 0 ? `+${record.improvement}` : record.improvement}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-1">较前3次</span>
                                </div>
                                {record.improvement > 0 && (
                                  <Badge variant="success" size="sm">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    进步
                                  </Badge>
                                )}
                                {record.improvement < 0 && (
                                  <Badge variant="danger" size="sm">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    退步
                                  </Badge>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">选择病例场景</h2>
          <p className="text-gray-600">点击卡片开始练习</p>
        </motion.div>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {cases.map((caseItem, index) => {
            const completed = isCaseCompleted(caseItem.id);
            const bestScore = getBestScoreForCase(caseItem.id);
            const practiceCount = getPracticeCountByCase(caseItem.id);
            const recordCount = getRecordCountByCase(caseItem.id);
            const isHovered = hoveredCase === caseItem.id;
            
            return (
              <motion.div
                key={caseItem.id}
                variants={item}
                onMouseEnter={() => setHoveredCase(caseItem.id)}
                onMouseLeave={() => setHoveredCase(null)}
              >
                <Card hover className="h-full flex flex-col">
                  <div className="relative">
                    <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-50 overflow-hidden">
                      <img
                        src={caseItem.avatar}
                        alt={caseItem.patientName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge 
                          className={`bg-gradient-to-r ${difficultyColors[caseItem.difficulty]} text-white border-0`}
                          size="sm"
                        >
                          {difficultyLabels[caseItem.difficulty]}
                        </Badge>
                        {completed && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            已完成
                          </Badge>
                        )}
                      </div>
                      {bestScore !== null && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-yellow-600">
                          最高分 {bestScore}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {caseItem.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {caseItem.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">患者：</span>
                        <span className="font-medium text-gray-700">
                          {caseItem.patientName}，{caseItem.age}岁
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">性格：</span>
                        <span className="text-gray-700 line-clamp-1">
                          {caseItem.patientPersonality}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 mt-0.5">风险：</span>
                        <div className="flex flex-wrap gap-1">
                          {caseItem.riskPoints.slice(0, 2).map((point, i) => (
                            <Badge key={i} variant="warning" size="sm">
                              {point.length > 10 ? point.slice(0, 10) + '...' : point}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-white border-t border-gray-100 flex flex-col gap-3">
                    <div className="w-full flex justify-center gap-2">
                      <Badge variant="info" size="sm" className="gap-1">
                        <MessageCircle className="w-3 h-3" />
                        话术练习 {practiceCount} 次
                      </Badge>
                      <Badge variant="primary" size="sm" className="gap-1">
                        <FileText className="w-3 h-3" />
                        记录训练 {recordCount} 次
                      </Badge>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartPractice(caseItem.id)}
                        className="gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        话术练习
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartRecord(caseItem.id)}
                        className="gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        记录训练
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/3" />
          </div>
          
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              帮助您成为更专业的口腔护理师
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              通过趣味化的场景训练，掌握标准化的随访沟通流程，
              避免遗漏刷牙指导、牙线使用、敏感期说明和复诊时机等关键要点。
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
                <span>3个经典病例场景</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
                <span>即时智能反馈</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
                <span>错题智能收集</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
                <span>带教统计分析</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
