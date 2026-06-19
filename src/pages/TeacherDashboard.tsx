import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GraduationCap
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
  getRadarChartData
} from '@/utils/statistics';
import type { MissingCategory } from '@/types';

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
  Cell
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
  const { userData, switchStudent } = useAppStore();
  const [viewMode, setViewMode] = useState<'class' | 'student'>('class');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  
  const students = userData.students || [];
  const wrongAnswers = userData.wrongAnswers || [];
  const practiceScores = userData.practiceScores || [];
  const recordResults = userData.recordTrainingResults || [];
  const currentStudentId = userData.currentStudentId || (students[0]?.id ?? '');
  
  const currentStudent = students.find(s => s.id === currentStudentId) || students[0];
  
  const classStats = getClassOverallStats(students, wrongAnswers, practiceScores, recordResults);
  const studentStats = currentStudent 
    ? getStudentStats(currentStudent.id, wrongAnswers, practiceScores, recordResults)
    : null;
  
  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { grade: '良好', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: '需加强', color: 'text-red-600', bg: 'bg-red-100' };
  };
  
  const classAverageScore = practiceScores.length > 0
    ? Math.round(practiceScores.reduce((sum, s) => sum + s.score, 0) / practiceScores.length)
    : 0;
  
  const classTotalPractices = practiceScores.length;
  const classTotalWrong = wrongAnswers.length;
  const classAvgRecordTrainings = students.length > 0
    ? Math.round(recordResults.length / students.length)
    : 0;
  
  const classRadarData = getRadarChartData(wrongAnswers);
  
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
    ? wrongAnswers.filter(w => w.studentId === currentStudent.id)
    : [];
  const studentPracticeScores = currentStudent
    ? practiceScores.filter(s => s.studentId === currentStudent.id)
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
  
  const handleSwitchStudent = (studentId: string) => {
    switchStudent(studentId);
    setStudentDropdownOpen(false);
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
              variant={viewMode === 'class' ? 'primary' : 'outline'}
              onClick={() => setViewMode('class')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              全班视角
            </Button>
            <Button
              variant={viewMode === 'student' ? 'primary' : 'outline'}
              onClick={() => setViewMode('student')}
              className="gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              单学员视角
            </Button>
          </div>
          
          {viewMode === 'student' && (
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
        
        {viewMode === 'class' ? (
          <>
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
            
            <Card className="mb-6">
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
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    晨会讲评重点（按错误占比排序）
                  </h2>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    导出报告
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {classStats.categoryReviews.length > 0 ? (
                  <div className="space-y-3">
                    {classStats.categoryReviews.slice(0, 5).map((review, index) => (
                      <motion.div
                        key={review.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                      >
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-orange-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-800">{review.categoryName}</h4>
                            <Badge variant="danger" size="sm">
                              {review.count} 次错误
                            </Badge>
                            <Badge variant="warning" size="sm">
                              {review.percentage}% 占比
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${review.percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                            />
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 mb-1">培训建议：</p>
                            <p className="text-sm text-gray-700">
                              {TRAINING_ADVICE[review.category]}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p>太棒了！暂无高频错误，学员整体表现优秀</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {studentStats && currentStudent && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">学员</p>
                          <p className="text-2xl font-bold text-gray-800">{currentStudent.name}</p>
                          {currentStudent.isActive ? (
                            <Badge variant="primary" size="sm">在读中</Badge>
                          ) : (
                            <Badge variant="default" size="sm">已结业</Badge>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                          {currentStudent.name.slice(0, 1)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">平均得分</p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold text-gray-800">{studentStats.averageScore}</p>
                            <Badge className={getScoreGrade(studentStats.averageScore).bg} size="sm">
                              <span className={getScoreGrade(studentStats.averageScore).color}>
                                {getScoreGrade(studentStats.averageScore).grade}
                              </span>
                            </Badge>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">练习次数</p>
                          <p className="text-3xl font-bold text-gray-800">{studentStats.practiceCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">错题总数</p>
                          <p className="text-3xl font-bold text-red-600">{studentWrongAnswers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
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
                        {studentPieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={studentPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {studentPieData.map((entry, index) => (
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
                        {studentRadarData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={studentRadarData}>
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
                </div>
                
                <Card className="mb-6">
                  <CardHeader>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      薄弱环节 TOP3
                    </h2>
                  </CardHeader>
                  <CardContent>
                    {studentStats.weakestCategories.length > 0 ? (
                      <div className="space-y-3">
                        {studentStats.weakestCategories.map((review, index) => (
                          <motion.div
                            key={review.category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                          >
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-orange-600">#{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-gray-800">{review.categoryName}</h4>
                                <Badge variant="danger" size="sm">
                                  {review.count} 次错误
                                </Badge>
                                <Badge variant="warning" size="sm">
                                  {review.percentage}% 占比
                                </Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${review.percentage}%` }}
                                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                />
                              </div>
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 mb-1">培训建议：</p>
                                <p className="text-sm text-gray-700">
                                  {TRAINING_ADVICE[review.category]}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 text-green-400 mx-auto mb-2" />
                        <p>太棒了！暂无薄弱环节，该学员表现优秀</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                        记录训练统计
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">总记录训练次数</p>
                        <p className="text-2xl font-bold text-purple-600">{studentStats.recordCount}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">平均记录得分</p>
                        <p className="text-2xl font-bold text-blue-600">{studentStats.averageRecordScore}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">常漏结构 TOP3</p>
                      <div className="space-y-3">
                        {(() => {
                          const sectionCounts: Record<string, number> = {};
                          const studentRecords = recordResults.filter(r => true);
                          studentRecords.forEach(r => {
                            r.missingSections.forEach(section => {
                              sectionCounts[section] = (sectionCounts[section] || 0) + 1;
                            });
                          });
                          const sortedSections = Object.entries(sectionCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3);
                          
                          if (sortedSections.length === 0) {
                            return (
                              <div className="text-center py-6 text-gray-500">
                                <Award className="w-10 h-10 text-green-400 mx-auto mb-2" />
                                <p>暂无遗漏数据，记录训练表现良好</p>
                              </div>
                            );
                          }
                          
                          return sortedSections.map(([section, count], index) => {
                            const percentage = studentRecords.length > 0 
                              ? Math.round((count / studentRecords.length) * 100) 
                              : 0;
                            return (
                              <motion.div
                                key={section}
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
                                    <h4 className="font-bold text-gray-800">{getSectionName(section as any)}</h4>
                                    <Badge variant="danger" size="sm">
                                      遗漏 {count} 次
                                    </Badge>
                                    {studentRecords.length > 0 && (
                                      <Badge variant="warning" size="sm">
                                        {percentage}% 占比
                                      </Badge>
                                    )}
                                  </div>
                                  {studentRecords.length > 0 && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#1A73E8]" />
                      各病例得分详情
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">病例名称</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">练习次数</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">平均分</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">评级</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentCasePerformance.map((item, index) => {
                            const grade = getScoreGrade(item.平均分);
                            return (
                              <motion.tr
                                key={item.caseId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <p className="font-medium text-gray-800">{item.fullName}</p>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <p className="text-gray-600">{item.练习次数}</p>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <p className={`font-bold ${
                                    item.平均分 >= 80 ? 'text-green-600' :
                                    item.平均分 >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {item.平均分 || '-'}
                                  </p>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  {item.平均分 > 0 && (
                                    <Badge className={grade.bg} size="sm">
                                      <span className={grade.color}>{grade.grade}</span>
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/practice/${item.caseId}`)}
                                  >
                                    查看详情
                                  </Button>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        晨会讲评重点（按错误占比排序）
                      </h2>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        导出报告
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {studentStats.categoryReviews.length > 0 ? (
                      <div className="space-y-3">
                        {studentStats.categoryReviews.slice(0, 5).map((review, index) => (
                          <motion.div
                            key={review.category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                          >
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-orange-600">#{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-gray-800">{review.categoryName}</h4>
                                <Badge variant="danger" size="sm">
                                  {review.count} 次错误
                                </Badge>
                                <Badge variant="warning" size="sm">
                                  {review.percentage}% 占比
                                </Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${review.percentage}%` }}
                                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                />
                              </div>
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 mb-1">培训建议：</p>
                                <p className="text-sm text-gray-700">
                                  {TRAINING_ADVICE[review.category]}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 text-green-400 mx-auto mb-2" />
                        <p>太棒了！暂无高频错误，该学员表现优秀</p>
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
