import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertTriangle,
  Calendar,
  ChevronDown,
  BookOpen,
  RefreshCw,
  Home,
  Trophy,
  ListOrdered,
  CheckCircle2,
  XCircle,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/appStore';
import { getCaseById } from '@/data/cases';
import { getCategoryReviews } from '@/utils/statistics';
import type { MissingCategory, CategoryReview, WrongAnswer } from '@/types';

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

export default function ReviewPage() {
  const navigate = useNavigate();
  const { userData, clearWrongAnswers } = useAppStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'this_week' | 'this_month'>('all');
  const [expandedCategory, setExpandedCategory] = useState<MissingCategory | null>(null);
  
  const wrongAnswers = userData.wrongAnswers || [];
  
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
  
  const categoryReviews = getCategoryReviews(filteredWrongAnswers);
  const top3Categories = categoryReviews.slice(0, 3);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const toggleExpand = (category: MissingCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };
  
  const handleClearAll = () => {
    if (confirm('确定要清空所有错题记录吗？此操作不可恢复。')) {
      clearWrongAnswers();
      setExpandedCategory(null);
    }
  };

  const getMaxCount = () => {
    if (categoryReviews.length === 0) return 1;
    return Math.max(...categoryReviews.map(c => c.count), 1);
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
            <h1 className="text-xl font-bold text-gray-800">晨会讲评</h1>
            <p className="text-sm text-gray-500">共 {filteredWrongAnswers.length} 条错题记录</p>
          </div>
          
          <div className="w-24" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">{filteredWrongAnswers.length}</p>
                  <p className="text-sm text-gray-500">总错题数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                高频错误 TOP3
              </h2>
            </CardHeader>
            <CardContent className="pt-0">
              {top3Categories.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {top3Categories.map((item, index) => (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          #{index + 1}
                        </div>
                        <Badge className={categoryBadgeColors[item.category]} size="sm">
                          {item.categoryName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{item.count} 次</span>
                        <span className="text-sm font-medium text-gray-800 w-12 text-right">{item.percentage}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {categoryReviews.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-blue-500" />
                今日晨会建议讲评顺序
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoryReviews.map((item, index) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                  >
                    <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{item.categoryName}</span>
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
        
        {categoryReviews.length === 0 ? (
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
          <div className="space-y-4">
            {categoryReviews.map((review: CategoryReview, index: number) => {
              const isExpanded = expandedCategory === review.category;
              const colors = categoryColors[review.category];
              const maxCount = getMaxCount();
              const progressWidth = (review.count / maxCount) * 100;
              
              return (
                <motion.div
                  key={review.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      isExpanded ? `ring-2 ${colors.ring} shadow-lg` : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleExpand(review.category)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xl font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-800 text-lg">{review.categoryName}</h4>
                              <Badge className={categoryBadgeColors[review.category]} size="sm">
                                {review.count} 次错误
                              </Badge>
                              <span className="text-sm font-medium text-gray-600">占比 {review.percentage}%</span>
                            </div>
                            <div className="w-full max-w-md h-3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressWidth}%` }}
                                transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                                className={`h-full ${colors.bar} rounded-full`}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-4"
                        >
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
                              
                              <div className={`${colors.bg} rounded-xl p-4`}>
                                <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                                  推荐讲评要点
                                </h5>
                                <div className="space-y-2">
                                  {review.teachingPoints.map((point, pointIndex) => (
                                    <motion.div
                                      key={pointIndex}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: pointIndex * 0.05 }}
                                      className="flex items-start gap-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{point}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  错误病例列表（{review.wrongAnswers.length} 条）
                                </h5>
                                <div className="space-y-3">
                                  {review.wrongAnswers.map((wrong: WrongAnswer, wrongIndex: number) => {
                                    const caseData = getCaseById(wrong.caseId);
                                    return (
                                      <motion.div
                                        key={wrong.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: wrongIndex * 0.03 }}
                                        className="bg-white rounded-xl border border-gray-200 p-4"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                              <BookOpen className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-800 text-sm">
                                                {caseData?.title || wrong.caseTitle || '未知病例'}
                                              </p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">{formatDate(wrong.timestamp)}</span>
                                                {wrong.studentName && (
                                                  <span className="text-xs text-gray-500">· {wrong.studentName}</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/practice/${wrong.caseId}`);
                                            }}
                                          >
                                            重新练习
                                          </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="bg-red-50 rounded-lg p-3">
                                            <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
                                              <XCircle className="w-3 h-3" />
                                              错误话术
                                            </p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{wrong.selectedOption}</p>
                                          </div>
                                          <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" />
                                              正确参考话术
                                            </p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{wrong.correctOption}</p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
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
