import type { WrongAnswer, PracticeScore, MissingCategory, ReviewStats, CategoryReview, RecordTrainingResult, RecordSection, Student } from '@/types';
import { getTeachingPointsByCategory } from './storage';

const CATEGORY_NAMES: Record<MissingCategory, string> = {
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

const SECTION_NAMES: Record<RecordSection, string> = {
  basic_info: '患者基本信息',
  chief_complaint: '主诉',
  present_illness: '现病史',
  oral_exam: '口腔检查',
  guidance: '护理指导',
  recheck_plan: '复诊计划'
};

export const getCategoryName = (category: MissingCategory): string => CATEGORY_NAMES[category] || '其他';
export const getSectionName = (section: RecordSection): string => SECTION_NAMES[section] || '其他';

export const calculateReviewStats = (
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[] = []
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
    brushing: 0, floss: 0, sensitivity: 0, recheck: 0, diet: 0,
    hygiene: 0, symptom: 0, emotional: 0, other: 0
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

  const totalRecordTrainings = recordResults.length;
  const averageRecordScore = totalRecordTrainings > 0
    ? Math.round(recordResults.reduce((sum, r) => sum + r.totalScore, 0) / totalRecordTrainings)
    : 0;

  const frequentMissingSections: Record<RecordSection, number> = {
    basic_info: 0, chief_complaint: 0, present_illness: 0,
    oral_exam: 0, guidance: 0, recheck_plan: 0
  };
  recordResults.forEach(r => {
    r.missingSections.forEach(section => {
      if (frequentMissingSections[section] !== undefined) {
        frequentMissingSections[section]++;
      }
    });
  });
  
  return {
    totalPractices,
    averageCorrectRate,
    accuracyRate,
    wrongByCategory,
    recentProgress,
    totalRecordTrainings,
    averageRecordScore,
    frequentMissingSections
  };
};

export const getCategoryReviews = (wrongAnswers: WrongAnswer[]): CategoryReview[] => {
  const totalWrong = wrongAnswers.length;
  const categoryMap = new Map<MissingCategory, WrongAnswer[]>();
  
  wrongAnswers.forEach(wa => {
    const existing = categoryMap.get(wa.missingCategory) || [];
    existing.push(wa);
    categoryMap.set(wa.missingCategory, existing);
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, answers]) => ({
      category,
      categoryName: getCategoryName(category),
      count: answers.length,
      percentage: totalWrong > 0 ? Math.round((answers.length / totalWrong) * 100) : 0,
      wrongAnswers: answers.sort((a, b) => b.timestamp - a.timestamp),
      teachingPoints: getTeachingPointsByCategory(category)
    }))
    .sort((a, b) => b.count - a.count);
};

export const getRadarChartData = (wrongAnswers: WrongAnswer[]) => {
  const wrongByCategory: Record<MissingCategory, number> = {
    brushing: 0, floss: 0, sensitivity: 0, recheck: 0, diet: 0,
    hygiene: 0, symptom: 0, emotional: 0, other: 0
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

export const getBarChartData = (wrongByCategory: Record<MissingCategory, number>) => {
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

export const getMostFrequentMistakes = (wrongAnswers: WrongAnswer[], limit: number = 5) => {
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

export const getStudentStats = (
  studentId: string,
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[]
) => {
  const studentWrongAnswers = wrongAnswers.filter(w => w.studentId === studentId);
  const studentScores = practiceScores.filter(s => s.studentId === studentId);
  const studentRecords = recordResults.filter(r => r.studentId === studentId);
  
  const stats = calculateReviewStats(studentWrongAnswers, studentScores, studentRecords);
  const categoryReviews = getCategoryReviews(studentWrongAnswers);
  const weakestCategories = categoryReviews.slice(0, 3);
  
  return {
    studentId,
    stats,
    categoryReviews,
    weakestCategories,
    practiceCount: studentScores.length,
    averageScore: studentScores.length > 0 
      ? Math.round(studentScores.reduce((sum, s) => sum + s.totalScore, 0) / studentScores.length)
      : 0,
    recordCount: studentRecords.length,
    averageRecordScore: studentRecords.length > 0
      ? Math.round(studentRecords.reduce((sum, r) => sum + r.totalScore, 0) / studentRecords.length)
      : 0
  };
};

export const getClassOverallStats = (
  students: Student[],
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[]
) => {
  const overallStats = calculateReviewStats(wrongAnswers, practiceScores, recordResults);
  const categoryReviews = getCategoryReviews(wrongAnswers);
  
  const studentPerformance = students.map(student => {
    const stats = getStudentStats(student.id, wrongAnswers, practiceScores, recordResults);
    return {
      student,
      ...stats
    };
  }).sort((a, b) => a.averageScore - b.averageScore);

  const sectionMissingCounts: Record<RecordSection, number> = {
    basic_info: 0, chief_complaint: 0, present_illness: 0,
    oral_exam: 0, guidance: 0, recheck_plan: 0
  };
  recordResults.forEach(r => {
    r.missingSections.forEach(section => {
      sectionMissingCounts[section]++;
    });
  });
  
  const frequentMissingSections = (Object.entries(sectionMissingCounts) as [RecordSection, number][])
    .map(([section, count]) => ({
      section,
      sectionName: getSectionName(section),
      count,
      percentage: recordResults.length > 0 ? Math.round((count / recordResults.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return {
    overallStats,
    categoryReviews,
    studentPerformance,
    frequentMissingSections,
    totalStudents: students.length,
    activeStudents: students.filter(s => s.isActive).length
  };
};

