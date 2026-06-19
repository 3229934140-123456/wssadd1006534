import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle, FileText, AlertTriangle, Trophy, CheckCircle2, Target, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cases } from '@/data/cases';
import { useAppStore } from '@/store/appStore';
import { getBestScoreForCase, isCaseCompleted, getPracticeCountByCase, getRecordCountByCase } from '@/utils/storage';
import { calculateReviewStats } from '@/utils/statistics';

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

export default function HomePage() {
  const navigate = useNavigate();
  const { userData } = useAppStore();
  const [hoveredCase, setHoveredCase] = useState<string | null>(null);
  
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
  
  const handleStartPractice = (caseId: string) => {
    navigate(`/practice/${caseId}`);
  };
  
  const handleStartRecord = (caseId: string) => {
    navigate(`/record/${caseId}`);
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
