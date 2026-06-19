import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertTriangle,
  Calendar,
  MessageCircle,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/appStore';
import { getCaseById } from '@/data/cases';
import { getMostFrequentMistakes } from '@/utils/statistics';
import type { WrongAnswer, MissingCategory } from '@/types';

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

const categoryColors: Record<MissingCategory, string> = {
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

export default function ReviewPage() {
  const navigate = useNavigate();
  const { userData, clearWrongAnswers } = useAppStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'this_week' | 'this_month'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const wrongAnswers = userData.wrongAnswers || [];
  const frequentMistakes = getMostFrequentMistakes(wrongAnswers);
  
  const filteredWrongAnswers = wrongAnswers.filter(item => {
    if (selectedFilter === 'all') return true;
    const date = new Date(item.timestamp);
    const now = new Date();
    if (selectedFilter === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (selectedFilter === 'this_month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    return true;
  });
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  const handleClearAll = () => {
    if (confirm('确定要清空所有错题记录吗？此操作不可恢复。')) {
      clearWrongAnswers();
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0FDF4] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">错题复盘</h1>
            <p className="text-sm text-gray-500">共 {wrongAnswers.length} 条错题记录</p>
          </div>
          
          <div className="w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{wrongAnswers.length}</p>
                  <p className="text-sm text-gray-500">总错题数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{frequentMistakes.length}</p>
                  <p className="text-sm text-gray-500">高频错误类型</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {wrongAnswers.length > 0 
                      ? formatDate(wrongAnswers[wrongAnswers.length - 1].timestamp).split(' ')[0]
                      : '-'
                    }
                  </p>
                  <p className="text-sm text-gray-500">最近练习日期</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {frequentMistakes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                高频错误类型（晨会讲评参考）
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {frequentMistakes.slice(0, 6).map((mistake, index) => (
                  <motion.div
                    key={mistake.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <Badge className={categoryColors[mistake.category as MissingCategory]} size="sm">
                          {categoryNames[mistake.category as MissingCategory]}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {mistake.count} 次错误
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{mistake.percentage}%</p>
                      <p className="text-xs text-gray-500">占比</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(['all', 'this_week', 'this_month'] as const).map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter === 'all' ? '全部' : filter === 'this_week' ? '本周' : '本月'}
              </Button>
            ))}
          </div>
          
          {wrongAnswers.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAll}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              清空记录
            </Button>
          )}
        </div>
        
        {filteredWrongAnswers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {wrongAnswers.length === 0 ? '还没有错题记录' : '当前筛选条件下没有错题'}
              </h3>
              <p className="text-gray-500 mb-6">
                {wrongAnswers.length === 0 
                  ? '快去练习吧，错题会自动收集到这里'
                  : '换个筛选条件试试'
                }
              </p>
              <Button variant="primary" onClick={() => navigate('/')} className="gap-2">
                <Home className="w-4 h-4" />
                开始练习
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWrongAnswers.map((item: WrongAnswer, index: number) => {
              const caseData = getCaseById(item.caseId);
              const isExpanded = expandedId === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      isExpanded ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleExpand(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {caseData?.title || '未知病例'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(item.timestamp)}
                              </span>
                              <Badge
                                className={categoryColors[item.missingCategory as MissingCategory]}
                                size="sm"
                              >
                                {categoryNames[item.missingCategory as MissingCategory]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-700">
                              {item.stepType === 'opening' ? '开场问候' :
                               item.stepType === 'symptom_inquiry' ? '症状询问' :
                               item.stepType === 'care_guidance' ? '护理指导' :
                               item.stepType === 'review_suggestion' ? '复诊建议' : '其他步骤'}
                            </p>
                            <p className="text-xs text-gray-500">
                              得分: {item.score}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                              <div className="bg-red-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-red-700 mb-2">您选择的话术：</p>
                                <p className="text-sm text-gray-700">{item.selectedOption}</p>
                              </div>
                              
                              <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-green-700 mb-2">正确参考话术：</p>
                                <p className="text-sm text-gray-700">{item.correctOption}</p>
                              </div>
                              
                              <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-blue-700 mb-2">系统反馈：</p>
                                <p className="text-sm text-gray-700">{item.feedback}</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/practice/${item.caseId}`);
                                  }}
                                  className="gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  重新练习
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/record/${item.caseId}`);
                                  }}
                                  className="gap-2"
                                >
                                  <FileText className="w-4 h-4" />
                                  记录练习
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
