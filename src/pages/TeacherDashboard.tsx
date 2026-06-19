import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Target,
  Calendar,
  MessageCircle,
  FileText,
  AlertTriangle,
  Award,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/appStore';
import { cases } from '@/data/cases';
import { calculateReviewStats, getRadarChartData, getMostFrequentMistakes } from '@/utils/statistics';
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
  Cell,
  Legend
} from 'recharts';

const categoryNames: Record<MissingCategory, string> = {
  brushing: '刷牙方式',
  floss: '牙线指导',
  sensitivity: '敏感期说明',
  recheck: '复诊时机',
  diet: '饮食指导',
  hygiene: '口腔卫生',
  symptom: '症状解释',
  emotional: '情绪安抚',
  other: '其他'
};

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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'mistakes'>('overview');
  
  const wrongAnswers = userData.wrongAnswers || [];
  const practiceScores = userData.practiceScores || [];
  
  const stats = calculateReviewStats(wrongAnswers, practiceScores);
  const radarData = getRadarChartData(wrongAnswers);
  const frequentMistakes = getMostFrequentMistakes(wrongAnswers);
  
  const casePerformance = cases.map(caseItem => {
    const caseScores = practiceScores.filter(s => s.caseId === caseItem.id);
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
  
  const pieData = frequentMistakes.map(mistake => ({
    name: categoryNames[mistake.category as MissingCategory] || '其他',
    value: mistake.count,
    category: mistake.category
  }));
  
  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { grade: '良好', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: '需加强', color: 'text-red-600', bg: 'bg-red-100' };
  };
  
  const averageScore = practiceScores.length > 0
    ? Math.round(practiceScores.reduce((sum, s) => sum + s.score, 0) / practiceScores.length)
    : 0;
  
  const gradeInfo = getScoreGrade(averageScore);
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总练习次数</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalPractices}</p>
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
                  <p className="text-sm text-gray-500 mb-1">平均得分</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-gray-800">{averageScore}</p>
                    <Badge className={gradeInfo.bg} size="sm">
                      <span className={gradeInfo.color}>{gradeInfo.grade}</span>
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
                  <p className="text-sm text-gray-500 mb-1">错题总数</p>
                  <p className="text-3xl font-bold text-red-600">{wrongAnswers.length}</p>
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
                  <p className="text-sm text-gray-500 mb-1">正确率</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.accuracyRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex gap-2 mb-6">
          {([
            { key: 'overview', label: '总览', icon: BarChart3 },
            { key: 'cases', label: '病例分析', icon: FileText },
            { key: 'mistakes', label: '错误分析', icon: AlertTriangle }
          ] as const).map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(tab.key)}
              className="gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#1A73E8]" />
                  错误类型分布
                </h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
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
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    晨会讲评重点
                  </h2>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    导出报告
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {frequentMistakes.length > 0 ? (
                  <div className="space-y-3">
                    {frequentMistakes.slice(0, 5).map((mistake, index) => (
                      <motion.div
                        key={mistake.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                      >
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-orange-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-800">
                              {categoryNames[mistake.category as MissingCategory]}
                            </h4>
                            <Badge variant="danger" size="sm">
                              {mistake.count} 次错误
                            </Badge>
                            <Badge variant="warning" size="sm">
                              {mistake.percentage}% 占比
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${mistake.percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                            />
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
          </div>
        )}
        
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1A73E8]" />
                  各病例平均分
                </h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={casePerformance} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
                                <p className="font-medium text-gray-800">{data.fullName}</p>
                                <p className="text-sm text-blue-600">平均分: {data.平均分}</p>
                                <p className="text-sm text-gray-500">练习次数: {data.练习次数}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="平均分" fill="#1A73E8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1A73E8]" />
                  病例详情
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
                      {casePerformance.map((item, index) => {
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
          </div>
        )}
        
        {activeTab === 'mistakes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {frequentMistakes.map((mistake, index) => (
              <motion.div
                key={mistake.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm font-bold text-orange-600">
                          #{index + 1}
                        </span>
                        {categoryNames[mistake.category as MissingCategory]}
                      </h2>
                      <Badge variant="danger" size="sm">
                        {mistake.count} 次
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">错误占比</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${mistake.percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full"
                          />
                        </div>
                        <p className="text-right text-sm text-gray-500 mt-1">{mistake.percentage}%</p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm font-medium text-blue-700 mb-2">培训建议：</p>
                        <p className="text-sm text-gray-700">
                          {mistake.category === 'brushing' && '重点强调巴氏刷牙法，配合视频演示，让学员动手操作练习。'}
                          {mistake.category === 'floss' && '加强牙线使用指导，包括正确的持线方法、穿线技巧和清洁动作。'}
                          {mistake.category === 'sensitivity' && '提醒学员术后敏感期的时长和常见症状，指导患者如何应对。'}
                          {mistake.category === 'recheck' && '规范复诊时间建议，根据不同病情制定个性化复诊计划。'}
                          {mistake.category === 'diet' && '增加饮食指导内容，包括术后饮食禁忌和推荐食物。'}
                          {mistake.category === 'hygiene' && '加强口腔卫生宣教的系统性，确保涵盖所有关键要点。'}
                          {mistake.category === 'symptom' && '培训常见术后症状的解释话术，使用通俗易懂的语言。'}
                          {mistake.category === 'emotional' && '强调沟通中的共情技巧，学会安抚焦虑患者的情绪。'}
                          {mistake.category === 'other' && '根据具体错误情况进行针对性培训。'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {frequentMistakes.length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="p-12 text-center">
                  <Award className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">数据优秀！</h3>
                  <p className="text-gray-500">
                    目前还没有收集到足够的错题数据，无法进行错误分析。
                    <br />
                    请让学员完成更多练习后再查看。
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
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
