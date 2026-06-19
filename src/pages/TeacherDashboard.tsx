import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  MessageCircle,
  FileText,
  AlertTriangle,
  Award,
  Download,
  ChevronDown,
  ClipboardList,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  Plus,
  Target,
  XCircle,
  BookOpen,
  LineChart as LineChartIcon,
  Filter,
  Check,
  Trash2,
  MessageSquare,
  Calendar,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/appStore';
import { cases } from '@/data/cases';
import { 
  getClassOverallStats, 
  getStudentStats, 
  getSectionName,
  getRadarChartData,
  generateMorningReviewPackage,
  generateStudentGrowthProfile,
  filterWrongAnswers,
  filterRecordResults,
  getFilterOptions
} from '@/utils/statistics';
import {
  addPracticeSuggestion,
  toggleSuggestionCompleted,
  saveMorningReviewChecklist,
  getMorningReviewChecklistByDate,
  updateChecklistItem,
  addTeacherComment,
  getTeacherCommentsByStudent,
  markCommentAsFollowedUp,
  deleteTeacherComment
} from '@/utils/storage';
import type { MissingCategory, StudentPracticeSuggestion, MorningReviewChecklist, MorningReviewChecklistItem, TeacherComment, FilterState, PracticeScore, RecordTrainingResult, WrongAnswer } from '@/types';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const PIE_COLORS = [
  '#1A73E8',
  '#34A853',
  '#FBBC04',
  '#EA4335',
  '#9C27B0',
  '#00BCD4',
  '#FF9800',
  '#4CAF50',
  '#E91E63'
];

const BAR_COLORS = [
  '#1A73E8',
  '#34A853',
  '#FBBC04',
  '#FF6B6B',
  '#9C27B0',
  '#00BCD4',
  '#E91E63',
  '#FF9800',
  '#9AA0A6'
];

const TRAINING_ADVICE: Record<MissingCategory, string> = {
  brushing: '重点强调巴氏刷牙法，配合视频演示，让学员动手操作练习。',
  floss: '加强牙线使用指导，包括正确的持线方法、穿线技巧和清洁动作。',
  sensitivity: '提醒学员术后敏感期的时长和常见症状，指导患者如何应对。',
  recheck: '规范复诊时间建议，根据不同病情制定个性化复诊计划。',
  diet: '增加饮食指导内容，包括术后饮食禁忌和推荐食物。',
  hygiene: '加强口腔卫生宣教的系统性，确保涵盖所有关键要点。',
  symptom: '培训常见术后症状的解释话术，使用通俗易懂的语言。',
  emotional: '强调沟通中的共情技巧，学会安抚焦虑患者的情绪。',
  other: '根据具体错误情况进行针对性培训。'
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData, switchStudent, loadUserData, selectedStudentId, viewMode: storeViewMode, setSelectedStudentId, setViewMode } = useAppStore();
  
  const urlStudentId = searchParams.get('studentId');
  const urlViewMode = searchParams.get('viewMode') as 'class' | 'individual' | null;
  
  const [localViewMode, setLocalViewMode] = useState<'class' | 'student'>(
    urlViewMode === 'individual' ? 'student' : storeViewMode === 'individual' ? 'student' : 'class'
  );
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [morningReviewTab, setMorningReviewTab] = useState<'common' | 'individual'>('common');
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestionType, setSuggestionType] = useState<'dialogue' | 'record' | 'review'>('dialogue');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    caseId: null,
    studentId: null,
    category: null,
    dateRange: 'all'
  });
  
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<Map<string, boolean>>(new Map());
  const [currentChecklist, setCurrentChecklist] = useState<MorningReviewChecklist | null>(null);
  
  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
  const [newCommentType, setNewCommentType] = useState<'dialogue' | 'record'>('dialogue');
  const [newCommentCaseId, setNewCommentCaseId] = useState<string>('');
  const [newCommentPracticeId, setNewCommentPracticeId] = useState<string>('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newCommentActionItems, setNewCommentActionItems] = useState<string[]>(['']);
  const [commentCaseDropdownOpen, setCommentCaseDropdownOpen] = useState(false);
  const [commentPracticeDropdownOpen, setCommentPracticeDropdownOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const students = userData.students || [];
  const wrongAnswers = userData.wrongAnswers || [];
  const practiceScores = userData.practiceScores || [];
  const recordResults = userData.recordTrainingResults || [];
  
  const effectiveStudentId = urlStudentId || selectedStudentId || userData.currentStudentId || (students[0]?.id ?? '');
  const currentStudentId = effectiveStudentId;
  
  const currentStudent = students.find(s => s.id === currentStudentId) || students[0];

  useEffect(() => {
    if (urlStudentId && students.length > 0) {
      const studentExists = students.some(s => s.id === urlStudentId);
      if (studentExists) {
        switchStudent(urlStudentId);
        setSelectedStudentId(urlStudentId);
      }
    }
    
    if (urlViewMode === 'individual') {
      setLocalViewMode('student');
      setViewMode('individual');
    } else if (storeViewMode === 'individual') {
      setLocalViewMode('student');
    }
  }, [urlStudentId, urlViewMode, students, storeViewMode, switchStudent, setSelectedStudentId, setViewMode]);
  
  const filterOptions = useMemo(() => {
    return getFilterOptions(wrongAnswers, recordResults, students);
  }, [wrongAnswers, recordResults, students]);
  
  const filteredWrongAnswers = useMemo(() => {
    return filterWrongAnswers(wrongAnswers, {
      caseId: filters.caseId,
      studentId: filters.studentId,
      category: filters.category,
      dateRange: filters.dateRange
    });
  }, [wrongAnswers, filters]);
  
  const filteredRecordResults = useMemo(() => {
    return filterRecordResults(recordResults, {
      caseId: filters.caseId,
      studentId: filters.studentId,
      dateRange: filters.dateRange
    });
  }, [recordResults, filters]);
  
  const filteredPracticeScores = useMemo(() => {
    let filtered = [...practiceScores];
    
    if (filters.caseId) {
      filtered = filtered.filter(s => s.caseId === filters.caseId);
    }
    if (filters.studentId) {
      filtered = filtered.filter(s => s.studentId === filters.studentId);
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          return filtered;
      }
      
      filtered = filtered.filter(s => s.timestamp >= startDate.getTime());
    }
    
    return filtered;
  }, [practiceScores, filters]);
  
  useEffect(() => {
    const savedChecklist = getMorningReviewChecklistByDate(today);
    if (savedChecklist) {
      setCurrentChecklist(savedChecklist);
      const selected = new Map<string, boolean>();
      savedChecklist.items.forEach(item => {
        selected.set(`${item.type}-${item.targetId}`, item.selected);
      });
      setSelectedChecklistItems(selected);
    }
  }, [today, refreshKey]);
  
  useEffect(() => {
    if (currentStudent) {
      const comments = getTeacherCommentsByStudent(currentStudent.id);
      setTeacherComments(comments);
    }
  }, [currentStudent, refreshKey]);
  
  const studentPracticeHistory = useMemo(() => {
    if (!currentStudent || !newCommentCaseId) return [];
    return practiceScores
      .filter(s => s.studentId === currentStudent.id && s.caseId === newCommentCaseId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [currentStudent, newCommentCaseId, practiceScores]);
  
  const studentRecordHistory = useMemo(() => {
    if (!currentStudent || !newCommentCaseId) return [];
    return recordResults
      .filter(r => r.studentId === currentStudent.id && r.caseId === newCommentCaseId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [currentStudent, newCommentCaseId, recordResults]);
  
  const classStats = getClassOverallStats(students, filteredWrongAnswers, filteredPracticeScores, filteredRecordResults);
  const studentStats = currentStudent 
    ? getStudentStats(currentStudent.id, filteredWrongAnswers, filteredPracticeScores, filteredRecordResults)
    : null;
  
  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { grade: '良好', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: '需加强', color: 'text-red-600', bg: 'bg-red-100' };
  };
  
  const classAverageScore = filteredPracticeScores.length > 0
    ? Math.round(filteredPracticeScores.reduce((sum, s) => sum + s.score, 0) / filteredPracticeScores.length)
    : 0;
  
  const classTotalPractices = filteredPracticeScores.length;
  const classTotalWrong = filteredWrongAnswers.length;
  const classAvgRecordTrainings = students.length > 0
    ? Math.round(filteredRecordResults.length / students.length)
    : 0;
  
  const classRadarData = getRadarChartData(filteredWrongAnswers);
  
  const classPieData = classStats.categoryReviews.map(review => ({
    name: review.categoryName,
    value: review.count,
    percentage: review.percentage,
    category: review.category
  }));
  
  const classBarData = [
    { name: '刷牙方式', count: classStats.overallStats.wrongByCategory.brushing },
    { name: '牙线使用', count: classStats.overallStats.wrongByCategory.floss },
    { name: '敏感期', count: classStats.overallStats.wrongByCategory.sensitivity },
    { name: '复诊时机', count: classStats.overallStats.wrongByCategory.recheck },
    { name: '饮食指导', count: classStats.overallStats.wrongByCategory.diet },
    { name: '口腔卫生', count: classStats.overallStats.wrongByCategory.hygiene },
    { name: '症状解释', count: classStats.overallStats.wrongByCategory.symptom },
    { name: '情绪安抚', count: classStats.overallStats.wrongByCategory.emotional },
    { name: '其他', count: classStats.overallStats.wrongByCategory.other }
  ];
  
  const studentWrongAnswers = currentStudent
    ? filteredWrongAnswers.filter(w => w.studentId === currentStudent.id)
    : [];
  const studentPracticeScores = currentStudent
    ? filteredPracticeScores.filter(s => s.studentId === currentStudent.id)
    : [];
  const studentRadarData = getRadarChartData(studentWrongAnswers);
  
  const studentPieData = studentStats?.categoryReviews.map(review => ({
    name: review.categoryName,
    value: review.count,
    percentage: review.percentage,
    category: review.category
  })) || [];
  
  const studentCasePerformance = cases.map(caseItem => {
    const caseScores = studentPracticeScores.filter(s => s.caseId === caseItem.id);
    const avgScore = caseScores.length > 0
      ? Math.round(caseScores.reduce((sum, s) => sum + s.score, 0) / caseScores.length)
      : 0;
    const practiceCount = caseScores.length;
    
    return {
      name: caseItem.title.length > 8 ? caseItem.title.slice(0, 8) + '...' : caseItem.title,
      fullName: caseItem.title,
      平均分: avgScore,
      练习次数: practiceCount,
      caseId: caseItem.id
    };
  });
  
  const morningReviewPackage = generateMorningReviewPackage(
    students,
    filteredWrongAnswers,
    filteredPracticeScores,
    filteredRecordResults
  );
  
  const studentGrowthProfile = currentStudent
    ? generateStudentGrowthProfile(
        currentStudent,
        filteredWrongAnswers,
        filteredPracticeScores,
        filteredRecordResults
      )
    : null;
  
  const checklistStats = currentChecklist ? {
    total: currentChecklist.items.filter(i => i.selected).length,
    completed: currentChecklist.items.filter(i => i.selected && i.completed).length,
    remaining: currentChecklist.items.filter(i => i.selected && !i.completed).length
  } : { total: 0, completed: 0, remaining: 0 };
  
  const handleSwitchStudent = (studentId: string) => {
    switchStudent(studentId);
    setStudentDropdownOpen(false);
  };
  
  const handleAddSuggestion = () => {
    if (!newSuggestion.trim() || !currentStudent) return;
    addPracticeSuggestion({
      studentId: currentStudent.id,
      content: newSuggestion.trim(),
      type: suggestionType,
      caseIds: [],
      createdBy: userData.name || '带教老师'
    });
    setNewSuggestion('');
    loadUserData();
  };
  
  const handleToggleSuggestion = (suggestionId: string) => {
    toggleSuggestionCompleted(suggestionId);
    loadUserData();
  };
  
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleResetFilters = () => {
    setFilters({
      caseId: null,
      studentId: null,
      category: null,
      dateRange: 'all'
    });
  };
  
  const handleChecklistItemToggle = (type: 'category' | 'student', targetId: string) => {
    const key = `${type}-${targetId}`;
    setSelectedChecklistItems(prev => {
      const next = new Map(prev);
      next.set(key, !next.get(key));
      return next;
    });
  };
  
  const handleSaveChecklist = () => {
    const items: MorningReviewChecklistItem[] = [];
    let order = 0;
    
    morningReviewPackage.commonProblems.forEach(item => {
      const key = `category-${item.category}`;
      const selected = selectedChecklistItems.get(key) || false;
      const existingItem = currentChecklist?.items.find(i => i.type === 'category' && i.targetId === item.category);
      items.push({
        type: 'category',
        targetId: item.category,
        targetName: item.categoryName,
        selected,
        completed: existingItem?.completed || false,
        order: order++
      });
    });
    
    morningReviewPackage.individualFocus.forEach(focus => {
      const key = `student-${focus.student.id}`;
      const selected = selectedChecklistItems.get(key) || false;
      const existingItem = currentChecklist?.items.find(i => i.type === 'student' && i.targetId === focus.student.id);
      items.push({
        type: 'student',
        targetId: focus.student.id,
        targetName: focus.student.name,
        selected,
        completed: existingItem?.completed || false,
        order: order++
      });
    });
    
    const saved = saveMorningReviewChecklist({
      id: currentChecklist?.id,
      date: today,
      items,
      createdBy: userData.name || '带教老师'
    });
    
    setCurrentChecklist(saved);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleMarkItemComplete = (itemIndex: number) => {
    if (!currentChecklist) return;
    const item = currentChecklist.items[itemIndex];
    updateChecklistItem(currentChecklist.id, itemIndex, { completed: !item.completed });
    setRefreshKey(prev => prev + 1);
  };
  
  const handleAddActionItem = () => {
    setNewCommentActionItems(prev => [...prev, '']);
  };
  
  const handleRemoveActionItem = (index: number) => {
    if (newCommentActionItems.length > 1) {
      setNewCommentActionItems(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handleActionItemChange = (index: number, value: string) => {
    setNewCommentActionItems(prev => prev.map((item, i) => i === index ? value : item));
  };
  
  const handleAddTeacherComment = () => {
    if (!currentStudent || !newCommentCaseId || !newCommentContent.trim()) return;
    
    const selectedCase = cases.find(c => c.id === newCommentCaseId);
    const actionItems = newCommentActionItems.filter(item => item.trim());
    
    addTeacherComment({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      type: newCommentType,
      caseId: newCommentCaseId,
      caseTitle: selectedCase?.title || '',
      practiceId: newCommentPracticeId || undefined,
      recordResultId: newCommentType === 'record' ? newCommentPracticeId || undefined : undefined,
      content: newCommentContent.trim(),
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      createdBy: userData.name || '带教老师'
    });
    
    setNewCommentType('dialogue');
    setNewCommentCaseId('');
    setNewCommentPracticeId('');
    setNewCommentContent('');
    setNewCommentActionItems(['']);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleMarkCommentFollowedUp = (commentId: string) => {
    markCommentAsFollowedUp(commentId);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('确定要删除这条批注吗？')) {
      deleteTeacherComment(commentId);
      setRefreshKey(prev => prev + 1);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">带教统计中心</h1>
            <p className="text-sm text-gray-500">学员练习数据总览</p>
          </div>
          
          <div className="w-24" />
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={localViewMode === 'class' ? 'primary' : 'outline'}
              onClick={() => {
                setLocalViewMode('class');
                setViewMode('class');
                setSelectedStudentId(null);
              }}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              全班视角
            </Button>
            <Button
              variant={localViewMode === 'student' ? 'primary' : 'outline'}
              onClick={() => {
                setLocalViewMode('student');
                setViewMode('individual');
              }}
              className="gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              单学员视角
            </Button>
          </div>
          
          {localViewMode === 'student' && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                className="gap-2 min-w-48 justify-between"
              >
                <UserCheck className="w-4 h-4" />
                <span className="flex-1 text-left">{currentStudent?.name || '选择学员'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${studentDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {studentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => handleSwitchStudent(student.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        student.id === currentStudentId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {student.name.slice(0, 1)}
                      </div>
                      <span className="font-medium text-gray-800">{student.name}</span>
                      {student.id === currentStudentId && (
                        <Badge variant="primary" size="sm">当前</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {localViewMode === 'class' ? (
          <>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-5 h-5 text-[#1A73E8]" />
                  <h3 className="font-bold text-gray-800">多维度筛选</h3>
                  {(filters.caseId || filters.studentId || filters.category || filters.dateRange !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="ml-auto text-sm text-gray-500 hover:text-gray-700">
                      重置筛选
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">病例筛选</label>
                    <select
                      value={filters.caseId || ''}
                      onChange={(e) => handleFilterChange('caseId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">全部病例</option>
                      {filterOptions.caseOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">学员筛选</label>
                    <select
                      value={filters.studentId || ''}
                      onChange={(e) => handleFilterChange('studentId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">全部学员</option>
                      {filterOptions.studentOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">环节筛选</label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', (e.target.value as MissingCategory) || null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">全部环节</option>
                      {filterOptions.categoryOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">时间范围</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value as 'all' | 'today' | 'week' | 'month')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">本周</option>
                      <option value="month">本月</option>
                    </select>
                  </div>
                </div>
                {(filters.caseId || filters.studentId || filters.category || filters.dateRange !== 'all') && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      筛选结果：错题 {filteredWrongAnswers.length} 条，练习 {filteredPracticeScores.length} 次，记录训练 {filteredRecordResults.length} 次
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">全班平均分</p>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-gray-800">{classAverageScore}</p>
                        <Badge className={getScoreGrade(classAverageScore).bg} size="sm">
                          <span className={getScoreGrade(classAverageScore).color}>
                            {getScoreGrade(classAverageScore).grade}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">总练习次数</p>
                      <p className="text-3xl font-bold text-gray-800">{classTotalPractices}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">全班错题总数</p>
                      <p className="text-3xl font-bold text-red-600">{classTotalWrong}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">平均记录训练次数</p>
                      <p className="text-3xl font-bold text-purple-600">{classAvgRecordTrainings}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#1A73E8]" />
                      晨会讲评包
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">一键生成今日晨会重点</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentChecklist && checklistStats.total > 0 && (
                      <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{checklistStats.total}</p>
                          <p className="text-xs text-gray-500">已安排</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{checklistStats.completed}</p>
                          <p className="text-xs text-gray-500">已完成</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-600">{checklistStats.remaining}</p>
                          <p className="text-xs text-gray-500">待讲</p>
                        </div>
                      </div>
                    )}
                    <Button onClick={handleSaveChecklist} className="gap-2">
                      <ClipboardList className="w-4 h-4" />
                      保存讲评清单
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      导出报告
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={morningReviewTab === 'common' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setMorningReviewTab('common')}
                  >
                    班级共性问题
                  </Button>
                  <Button
                    variant={morningReviewTab === 'individual' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setMorningReviewTab('individual')}
                  >
                    个人薄弱项
                  </Button>
                </div>
                
                {morningReviewTab === 'common' ? (
                  morningReviewPackage.commonProblems.length > 0 ? (
                    <div className="space-y-4">
                      {morningReviewPackage.commonProblems.map((item, idx) => {
                        const checklistKey = `category-${item.category}`;
                        const isSelected = selectedChecklistItems.get(checklistKey) || false;
                        const checklistItem = currentChecklist?.items.find(i => i.type === 'category' && i.targetId === item.category);
                        const itemIndex = currentChecklist?.items.findIndex(i => i.type === 'category' && i.targetId === item.category);
                        const isCompleted = checklistItem?.completed || false;
                        
                        return (
                        <motion.div
                          key={item.category}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border transition-all ${
                            isCompleted ? 'border-green-300 bg-green-50' : 
                            isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleChecklistItemToggle('category', item.category)}
                                className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                                <span className="text-lg font-bold text-orange-600">#{idx + 1}</span>
                              </div>
                              <div>
                                <h4 className={`font-bold text-lg ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.categoryName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="danger" size="sm">{item.count} 次错误</Badge>
                                  <Badge variant="warning" size="sm">{item.percentage}% 占比</Badge>
                                  {isCompleted && <Badge variant="success" size="sm">已完成</Badge>}
                                </div>
                              </div>
                            </div>
                            {isSelected && currentChecklist && itemIndex !== undefined && (
                              <Button
                                variant={isCompleted ? 'outline' : 'primary'}
                                size="sm"
                                onClick={() => handleMarkItemComplete(itemIndex)}
                                className="gap-1"
                              >
                                {isCompleted ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    取消完成
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    标记完成
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          
                          <div className="mb-4 p-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                            <p className="text-sm font-medium text-gray-600 mb-1">💬 推荐讲评话术：</p>
                            <p className="text-gray-700 leading-relaxed">{item.suggestedSpeech}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                关联病例
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.relatedCases.map(c => (
                                  <button
                                    key={c.caseId}
                                    onClick={() => navigate(`/practice/${c.caseId}`)}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    {c.caseTitle} ({c.count}次)
                                  </button>
                                ))}
                                {item.relatedCases.length === 0 && (
                                  <span className="text-sm text-gray-400">暂无</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                相关学生（点名关注）
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.relatedStudents.map(s => (
                                  <span
                                    key={s.studentId}
                                    className="px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg"
                                  >
                                    {s.studentName} ({s.count}次)
                                  </span>
                                ))}
                                {item.relatedStudents.length === 0 && (
                                  <span className="text-sm text-gray-400">暂无</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {item.wrongAnswerExamples.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">❌ 错误示例 vs ✅ 正确话术</p>
                              <div className="space-y-2">
                                {item.wrongAnswerExamples.slice(0, 2).map((wa, i) => (
                                  <div key={wa.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                      <div className="flex items-center gap-1 mb-1">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs font-medium text-red-600">错误话术</span>
                                      </div>
                                      <p className="text-sm text-red-700 line-clamp-2">{wa.selectedOption || wa.selectedContent}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                      <div className="flex items-center gap-1 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-medium text-green-600">正确话术</span>
                                      </div>
                                      <p className="text-sm text-green-700 line-clamp-2">{wa.correctOption || wa.correctContent}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">📋 培训要点</p>
                            <ul className="space-y-1.5">
                              {item.teachingPoints.slice(0, 4).map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )})}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Award className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <p className="text-lg font-medium">太棒了！暂无高频错误</p>
                      <p className="text-sm mt-1">学员整体表现优秀，继续保持！</p>
                    </div>
                  )
                ) : (
                  morningReviewPackage.individualFocus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {morningReviewPackage.individualFocus.map((focus, idx) => {
                        const checklistKey = `student-${focus.student.id}`;
                        const isSelected = selectedChecklistItems.get(checklistKey) || false;
                        const checklistItem = currentChecklist?.items.find(i => i.type === 'student' && i.targetId === focus.student.id);
                        const itemIndex = currentChecklist?.items.findIndex(i => i.type === 'student' && i.targetId === focus.student.id);
                        const isCompleted = checklistItem?.completed || false;
                        
                        return (
                        <motion.div
                          key={focus.student.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-5 bg-white rounded-xl border transition-all hover:shadow-lg ${
                            isCompleted ? 'border-green-300 bg-green-50' : 
                            isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleChecklistItemToggle('student', focus.student.id)}
                              className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                                {focus.student.name.slice(0, 1)}
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{focus.student.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {focus.student.isActive ? (
                                    <Badge variant="primary" size="sm">在读中</Badge>
                                  ) : (
                                    <Badge variant="default" size="sm">已结业</Badge>
                                  )}
                                  {isCompleted && <Badge variant="success" size="sm">已完成</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>
                          {isSelected && currentChecklist && itemIndex !== undefined && (
                            <div className="mb-4">
                              <Button
                                variant={isCompleted ? 'outline' : 'primary'}
                                size="sm"
                                onClick={() => handleMarkItemComplete(itemIndex)}
                                className="gap-1 w-full"
                              >
                                {isCompleted ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    取消完成
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    标记完成
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">TOP3 薄弱环节</p>
                            <div className="flex flex-wrap gap-2">
                              {focus.weakestCategories.length > 0 ? focus.weakestCategories.map((w, i) => (
                                <Badge key={w.category} variant="danger" size="sm">
                                  #{i + 1} {w.categoryName}
                                </Badge>
                              )) : (
                                <Badge variant="success" size="sm">表现优秀</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">下次练习建议</p>
                            <div className="space-y-2">
                              {focus.practiceSuggestions.map((sug, i) => (
                                <label key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-blue-600 rounded" />
                                  <span className="text-sm text-gray-700">{sug}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )})}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <p className="text-lg font-medium">暂无学员数据</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-[#1A73E8]" />
                    错误类型分布
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {classPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={classPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {classPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        暂无数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#1A73E8]" />
                    能力雷达图
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {classRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={classRadarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="掌握程度"
                            dataKey="score"
                            stroke="#1A73E8"
                            fill="#1A73E8"
                            fillOpacity={0.3}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        暂无数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#1A73E8]" />
                    各错误类型统计
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classBarData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="错误次数" radius={[4, 4, 0, 0]}>
                          {classBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1A73E8]" />
                  学员排行榜（按平均分从低到高）
                </h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">排名</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">学员</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">练习次数</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">平均分</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">评级</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">薄弱项</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStats.studentPerformance.map((perf, index) => {
                        const grade = getScoreGrade(perf.averageScore);
                        const weakest = perf.weakestCategories.slice(0, 2);
                        return (
                          <motion.tr
                            key={perf.student.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-red-100 text-red-600' :
                                index === 1 ? 'bg-orange-100 text-orange-600' :
                                index === 2 ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-medium text-blue-600">
                                  {perf.student.name.slice(0, 1)}
                                </div>
                                <span className="font-medium text-gray-800">{perf.student.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <p className="text-gray-600">{perf.practiceCount}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <p className={`font-bold ${
                                perf.averageScore >= 80 ? 'text-green-600' :
                                perf.averageScore >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {perf.averageScore || '-'}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {perf.averageScore > 0 && (
                                <Badge className={grade.bg} size="sm">
                                  <span className={grade.color}>{grade.grade}</span>
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1">
                                {weakest.length > 0 ? weakest.map(w => (
                                  <Badge key={w.category} variant="danger" size="sm">
                                    {w.categoryName}
                                  </Badge>
                                )) : (
                                  <Badge variant="success" size="sm">表现优秀</Badge>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                    记录训练统计
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">总记录训练次数</p>
                    <p className="text-2xl font-bold text-purple-600">{classStats.overallStats.totalRecordTrainings}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">平均记录得分</p>
                    <p className="text-2xl font-bold text-blue-600">{classStats.overallStats.averageRecordScore}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">学员人均记录训练</p>
                    <p className="text-2xl font-bold text-orange-600">{classAvgRecordTrainings} 次</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">常漏结构 TOP3</p>
                  <div className="space-y-3">
                    {classStats.frequentMissingSections.slice(0, 3).map((item, index) => (
                      <motion.div
                        key={item.section}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-orange-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-gray-800">{getSectionName(item.section)}</h4>
                            <Badge variant="danger" size="sm">
                              遗漏 {item.count} 次
                            </Badge>
                            {recordResults.length > 0 && (
                              <Badge variant="warning" size="sm">
                                {item.percentage}% 占比
                              </Badge>
                            )}
                          </div>
                          {recordResults.length > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {classStats.frequentMissingSections.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Award className="w-10 h-10 text-green-400 mx-auto mb-2" />
                        <p>暂无遗漏数据，记录训练表现良好</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {studentGrowthProfile && currentStudent && (
              <>
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-blue-600">
                          {currentStudent.name.slice(0, 1)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{currentStudent.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            {currentStudent.isActive ? (
                              <Badge variant="primary" size="sm">在读中</Badge>
                            ) : (
                              <Badge variant="default" size="sm">已结业</Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              入学：{new Date(currentStudent.joinDate).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">总练习次数</p>
                          <p className="text-3xl font-bold text-gray-800">
                            {studentGrowthProfile.totalDialoguePractices + studentGrowthProfile.totalRecordPractices}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            话术 {studentGrowthProfile.totalDialoguePractices} + 记录 {studentGrowthProfile.totalRecordPractices}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">平均分</p>
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-3xl font-bold text-gray-800">
                              {studentGrowthProfile.averageDialogueScore}
                            </p>
                            <Badge className={getScoreGrade(studentGrowthProfile.averageDialogueScore).bg} size="sm">
                              <span className={getScoreGrade(studentGrowthProfile.averageDialogueScore).color}>
                                {getScoreGrade(studentGrowthProfile.averageDialogueScore).grade}
                              </span>
                            </Badge>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">进步分</p>
                          <p className={`text-3xl font-bold ${
                            studentGrowthProfile.improvement > 0 ? 'text-green-600' :
                            studentGrowthProfile.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {studentGrowthProfile.improvement > 0 ? '+' : ''}{studentGrowthProfile.improvement}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">较前5次练习</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-[#1A73E8]" />
                      成长趋势（最近10天）
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {studentGrowthProfile.overallTrend.dates.some((_, i) => 
                        studentGrowthProfile.overallTrend.dialogueScores[i] > 0 ||
                        studentGrowthProfile.overallTrend.recordScores[i] > 0 ||
                        studentGrowthProfile.overallTrend.correctRates[i] > 0
                      ) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={studentGrowthProfile.overallTrend.dates.map((date, i) => ({
                            date,
                            话术得分: studentGrowthProfile.overallTrend.dialogueScores[i] || null,
                            记录得分: studentGrowthProfile.overallTrend.recordScores[i] || null,
                            正确率: studentGrowthProfile.overallTrend.correctRates[i] || null
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="话术得分"
                              stroke="#1A73E8"
                              strokeWidth={2.5}
                              dot={{ fill: '#1A73E8', r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey="记录得分"
                              stroke="#34A853"
                              strokeWidth={2.5}
                              dot={{ fill: '#34A853', r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey="正确率"
                              stroke="#FBBC04"
                              strokeWidth={2.5}
                              dot={{ fill: '#FBBC04', r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          暂无趋势数据，请完成更多练习
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        常错环节 TOP5
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {studentGrowthProfile.frequentWrongCategories.length > 0 ? (
                        <div className="space-y-3">
                          {studentGrowthProfile.frequentWrongCategories.map((item, idx) => (
                            <motion.div
                              key={item.category}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                            >
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-orange-600">#{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-800 truncate">{item.categoryName}</h4>
                                  <Badge variant="danger" size="sm">{item.count}次</Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Award className="w-10 h-10 text-green-400 mx-auto mb-2" />
                          <p>暂无常错环节，表现优秀！</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                        常漏结构
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {studentGrowthProfile.frequentMissingSections.length > 0 ? (
                        <div className="space-y-3">
                          {studentGrowthProfile.frequentMissingSections.map((item, idx) => (
                            <motion.div
                              key={item.section}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-100"
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-800">{item.sectionName}</h4>
                                  <Badge variant="danger" size="sm">遗漏 {item.count} 次</Badge>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Award className="w-10 h-10 text-green-400 mx-auto mb-2" />
                          <p>暂无遗漏结构，记录训练表现良好！</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#1A73E8]" />
                        最近10次话术练习
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {studentGrowthProfile.recentPractices.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {studentGrowthProfile.recentPractices.map((practice, idx) => {
                            const grade = getScoreGrade(practice.totalScore);
                            return (
                              <motion.div
                                key={practice.caseId + '-' + practice.timestamp + '-' + idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => navigate(`/practice/${practice.caseId}`)}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{practice.caseTitle}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(practice.timestamp).toLocaleString('zh-CN', { 
                                        month: 'numeric', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <Badge className={grade.bg} size="sm">
                                    <span className={grade.color}>{practice.totalScore}分</span>
                                  </Badge>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p>暂无话术练习记录</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                        最近10次记录训练
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {studentGrowthProfile.recentRecords.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {studentGrowthProfile.recentRecords.map((record, idx) => {
                            const grade = getScoreGrade(record.totalScore);
                            return (
                              <motion.div
                                key={record.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ClipboardList className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{record.caseTitle}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(record.timestamp).toLocaleString('zh-CN', { 
                                        month: 'numeric', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <Badge className={grade.bg} size="sm">
                                    <span className={grade.color}>{record.totalScore}分</span>
                                  </Badge>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p>暂无记录训练数据</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600" />
                        老师布置的练习建议
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-3">添加新建议</p>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex gap-2">
                          <Button
                            variant={suggestionType === 'dialogue' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSuggestionType('dialogue')}
                          >
                            话术练习
                          </Button>
                          <Button
                            variant={suggestionType === 'record' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSuggestionType('record')}
                          >
                            记录训练
                          </Button>
                          <Button
                            variant={suggestionType === 'review' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSuggestionType('review')}
                          >
                            复习巩固
                          </Button>
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={newSuggestion}
                            onChange={(e) => setNewSuggestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSuggestion()}
                            placeholder="请输入练习建议内容..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <Button onClick={handleAddSuggestion} className="gap-2">
                            <Plus className="w-4 h-4" />
                            添加
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {studentGrowthProfile.practiceSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {studentGrowthProfile.practiceSuggestions.map((sug: StudentPracticeSuggestion, idx: number) => (
                          <motion.div
                            key={sug.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                              sug.completed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <button
                              onClick={() => handleToggleSuggestion(sug.id)}
                              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                sug.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {sug.completed && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={
                                    sug.type === 'dialogue' ? 'info' :
                                    sug.type === 'record' ? 'primary' : 'warning'
                                  } 
                                  size="sm"
                                >
                                  {sug.type === 'dialogue' ? '话术' : sug.type === 'record' ? '记录' : '复习'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {new Date(sug.createdAt).toLocaleString('zh-CN', { 
                                    month: 'numeric', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <span className="text-xs text-gray-400">by {sug.createdBy}</span>
                              </div>
                              <p className={`text-gray-700 ${sug.completed ? 'line-through text-gray-400' : ''}`}>
                                {sug.content}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p>暂无练习建议，在上方添加吧！</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        老师批注
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-4">新增批注</p>
                      
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button
                            variant={newCommentType === 'dialogue' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setNewCommentType('dialogue');
                              setNewCommentPracticeId('');
                            }}
                          >
                            话术练习
                          </Button>
                          <Button
                            variant={newCommentType === 'record' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setNewCommentType('record');
                              setNewCommentPracticeId('');
                            }}
                          >
                            记录训练
                          </Button>
                        </div>
                        
                        <div className="relative">
                          <label className="block text-xs font-medium text-gray-500 mb-1">选择病例</label>
                          <button
                            type="button"
                            onClick={() => setCommentCaseDropdownOpen(!commentCaseDropdownOpen)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <span className={newCommentCaseId ? 'text-gray-800' : 'text-gray-400'}>
                              {newCommentCaseId ? cases.find(c => c.id === newCommentCaseId)?.title : '请选择病例'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${commentCaseDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {commentCaseDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-60 overflow-y-auto">
                              {cases.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setNewCommentCaseId(c.id);
                                    setNewCommentPracticeId('');
                                    setCommentCaseDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                    newCommentCaseId === c.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                  }`}
                                >
                                  {c.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {newCommentCaseId && (
                          <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 mb-1">关联练习记录（可选）</label>
                            <button
                              type="button"
                              onClick={() => setCommentPracticeDropdownOpen(!commentPracticeDropdownOpen)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                              <span className={newCommentPracticeId ? 'text-gray-800' : 'text-gray-400'}>
                                {newCommentPracticeId ? (
                                  newCommentType === 'dialogue' 
                                    ? studentPracticeHistory.find(p => p.caseId + '-' + p.timestamp === newCommentPracticeId)
                                        ?.caseTitle + ' - ' + new Date(Number(newCommentPracticeId.split('-')[1])).toLocaleString('zh-CN')
                                    : studentRecordHistory.find(r => r.id === newCommentPracticeId)
                                        ?.caseTitle + ' - ' + new Date(studentRecordHistory.find(r => r.id === newCommentPracticeId)?.timestamp || 0).toLocaleString('zh-CN')
                                ) : '不关联具体练习记录'}
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${commentPracticeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {commentPracticeDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-60 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewCommentPracticeId('');
                                    setCommentPracticeDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                    !newCommentPracticeId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                  }`}
                                >
                                  不关联具体练习记录
                                </button>
                                {newCommentType === 'dialogue' ? (
                                  studentPracticeHistory.length > 0 ? (
                                    studentPracticeHistory.map((practice, idx) => (
                                      <button
                                        key={practice.caseId + '-' + practice.timestamp}
                                        type="button"
                                        onClick={() => {
                                          setNewCommentPracticeId(practice.caseId + '-' + practice.timestamp);
                                          setCommentPracticeDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                          newCommentPracticeId === practice.caseId + '-' + practice.timestamp ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>第{studentPracticeHistory.length - idx}次练习</span>
                                          <span className="text-xs text-gray-400">
                                            {new Date(practice.timestamp).toLocaleString('zh-CN', { 
                                              month: 'numeric', 
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })} - {practice.totalScore}分
                                          </span>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                      暂无该病例的话术练习记录
                                    </div>
                                  )
                                ) : (
                                  studentRecordHistory.length > 0 ? (
                                    studentRecordHistory.map((record, idx) => (
                                      <button
                                        key={record.id}
                                        type="button"
                                        onClick={() => {
                                          setNewCommentPracticeId(record.id);
                                          setCommentPracticeDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                          newCommentPracticeId === record.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>第{studentRecordHistory.length - idx}次记录</span>
                                          <span className="text-xs text-gray-400">
                                            {new Date(record.timestamp).toLocaleString('zh-CN', { 
                                              month: 'numeric', 
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })} - {record.totalScore}分
                                          </span>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                      暂无该病例的记录训练数据
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">批注内容</label>
                          <textarea
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="请输入批注内容..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">待办要点</label>
                          <div className="space-y-2">
                            {newCommentActionItems.map((item, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleActionItemChange(idx, e.target.value)}
                                  placeholder={`待办要点 ${idx + 1}`}
                                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {newCommentActionItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveActionItem(idx)}
                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddActionItem}
                              className="gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              添加待办
                            </Button>
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleAddTeacherComment}
                          disabled={!newCommentCaseId || !newCommentContent.trim()}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          提交批注
                        </Button>
                      </div>
                    </div>
                    
                    {teacherComments.length > 0 ? (
                      <div className="space-y-4">
                        {teacherComments.map((comment, idx) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border transition-all ${
                              comment.followedUp 
                                ? 'bg-gray-50 border-gray-200 opacity-60' 
                                : 'bg-white border-gray-200 hover:border-purple-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={comment.type === 'dialogue' ? 'info' : 'primary'}
                                  size="sm"
                                >
                                  {comment.type === 'dialogue' ? '话术' : '记录'}
                                </Badge>
                                <Badge variant="default" size="sm">
                                  {comment.caseTitle}
                                </Badge>
                                {comment.followedUp ? (
                                  <Badge variant="success" size="sm">已跟进</Badge>
                                ) : (
                                  <Badge variant="warning" size="sm">未跟进</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!comment.followedUp && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkCommentFollowedUp(comment.id)}
                                    className="text-xs h-7 px-2"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    标记已跟进
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-500 hover:bg-red-50 h-7 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className={`text-sm mb-3 ${comment.followedUp ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {comment.content}
                            </p>
                            
                            {comment.actionItems && comment.actionItems.length > 0 && (
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-2">待办要点：</p>
                                <ul className="space-y-1">
                                  {comment.actionItems.map((item, i) => (
                                    <li key={i} className={`text-sm flex items-start gap-2 ${comment.followedUp ? 'text-gray-400' : 'text-gray-600'}`}>
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(comment.createdAt).toLocaleString('zh-CN', { 
                                  month: 'numeric', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                by {comment.createdBy}
                              </span>
                              {comment.followedUp && comment.followedUpAt && (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  跟进于 {new Date(comment.followedUpAt).toLocaleString('zh-CN', { 
                                    month: 'numeric', 
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p>暂无老师批注，在上方添加吧！</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            <Users className="w-4 h-4 inline mr-1" />
            本页数据仅供带教老师内部参考，可用于晨会讲评和针对性培训
          </p>
        </div>
      </div>
    </div>
  );
}
