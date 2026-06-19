import type { WrongAnswer, PracticeScore, MissingCategory, ReviewStats } from '@/types';

export const calculateReviewStats = (
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[]
): ReviewStats => {
  const totalPractices = practiceScores.length;
  
  const averageCorrectRate = totalPractices > 0
    ? Math.round(
        practiceScores.reduce((sum, s) => sum + s.correctRate, 0) / totalPractices
      )
    : 0;
  
  const totalQuestions = practiceScores.reduce((sum, s) => sum + 4, 0);
  const correctAnswers = totalQuestions - wrongAnswers.length;
  const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  const wrongByCategory: Record<MissingCategory, number> = {
    brushing: 0,
    floss: 0,
    sensitivity: 0,
    recheck: 0,
    diet: 0,
    hygiene: 0,
    symptom: 0,
    emotional: 0,
    other: 0
  };
  
  wrongAnswers.forEach(wa => {
    if (wrongByCategory[wa.missingCategory] !== undefined) {
      wrongByCategory[wa.missingCategory]++;
    }
  });
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });
  
  const recentProgress = last7Days.map(date => {
    const dayScores = practiceScores.filter(s => 
      new Date(s.timestamp).toISOString().split('T')[0] === date
    );
    
    const correctRate = dayScores.length > 0
      ? Math.round(dayScores.reduce((sum, s) => sum + s.correctRate, 0) / dayScores.length)
      : 0;
    
    return {
      date: date.slice(5),
      correctRate
    };
  });
  
  return {
    totalPractices,
    averageCorrectRate,
    accuracyRate,
    wrongByCategory,
    recentProgress
  };
};

export const getRadarChartData = (
  wrongAnswers: WrongAnswer[]
) => {
  const wrongByCategory: Record<MissingCategory, number> = {
    brushing: 0,
    floss: 0,
    sensitivity: 0,
    recheck: 0,
    diet: 0,
    hygiene: 0,
    symptom: 0,
    emotional: 0,
    other: 0
  };
  
  wrongAnswers.forEach(wa => {
    if (wrongByCategory[wa.missingCategory] !== undefined) {
      wrongByCategory[wa.missingCategory]++;
    }
  });
  
  const maxValue = Math.max(...Object.values(wrongByCategory), 1);
  
  return [
    { category: '刷牙方式', score: 100 - Math.round((wrongByCategory.brushing / maxValue) * 100), fullMark: 100 },
    { category: '牙线使用', score: 100 - Math.round((wrongByCategory.floss / maxValue) * 100), fullMark: 100 },
    { category: '敏感期', score: 100 - Math.round((wrongByCategory.sensitivity / maxValue) * 100), fullMark: 100 },
    { category: '复诊时机', score: 100 - Math.round((wrongByCategory.recheck / maxValue) * 100), fullMark: 100 },
    { category: '饮食指导', score: 100 - Math.round((wrongByCategory.diet / maxValue) * 100), fullMark: 100 },
    { category: '口腔卫生', score: 100 - Math.round((wrongByCategory.hygiene / maxValue) * 100), fullMark: 100 }
  ];
};

export const getBarChartData = (
  wrongByCategory: Record<MissingCategory, number>
) => {
  return [
    { name: '刷牙方式', count: wrongByCategory.brushing, fill: '#1A73E8' },
    { name: '牙线使用', count: wrongByCategory.floss, fill: '#34A853' },
    { name: '敏感期', count: wrongByCategory.sensitivity, fill: '#FBBC04' },
    { name: '复诊时机', count: wrongByCategory.recheck, fill: '#FF6B6B' },
    { name: '饮食指导', count: wrongByCategory.diet, fill: '#9C27B0' },
    { name: '口腔卫生', count: wrongByCategory.hygiene, fill: '#00BCD4' },
    { name: '症状解释', count: wrongByCategory.symptom, fill: '#E91E63' },
    { name: '情绪安抚', count: wrongByCategory.emotional, fill: '#FF9800' },
    { name: '其他', count: wrongByCategory.other, fill: '#9AA0A6' }
  ];
};

export const getMostFrequentMistakes = (
  wrongAnswers: WrongAnswer[],
  limit: number = 5
) => {
  const totalWrong = wrongAnswers.length;
  const mistakeMap = new Map<string, { count: number; category: MissingCategory; caseTitle: string; content: string }>();
  
  wrongAnswers.forEach(wa => {
    const key = wa.selectedContent.slice(0, 50);
    const existing = mistakeMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      mistakeMap.set(key, {
        count: 1,
        category: wa.missingCategory,
        caseTitle: wa.caseTitle,
        content: wa.selectedContent
      });
    }
  });
  
  return Array.from(mistakeMap.values())
    .map(data => ({
      ...data,
      percentage: totalWrong > 0 ? Math.round((data.count / totalWrong) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const getTeacherStats = (
  allWrongAnswers: WrongAnswer[],
  allScores: PracticeScore[]
) => {
  const categoryTotals: Record<MissingCategory, number> = {
    brushing: 0,
    floss: 0,
    sensitivity: 0,
    recheck: 0,
    diet: 0,
    hygiene: 0,
    symptom: 0,
    emotional: 0,
    other: 0
  };
  
  allWrongAnswers.forEach(wa => {
    categoryTotals[wa.missingCategory]++;
  });
  
  const weakestCategory = (Object.entries(categoryTotals) as [MissingCategory, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'brushing';
  
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s.totalScore, 0) / allScores.length)
    : 0;
  
  const morningReviewQuestions = getMostFrequentMistakes(allWrongAnswers, 10);
  
  return {
    totalStudents: 1,
    totalPractices: allScores.length,
    averageScore: avgScore,
    weakestCategory,
    categoryTotals,
    morningReviewQuestions
  };
};
