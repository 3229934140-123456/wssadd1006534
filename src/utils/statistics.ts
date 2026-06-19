import type { WrongAnswer, PracticeScore, MissingCategory, ReviewStats, CategoryReview, RecordTrainingResult, RecordSection, Student, MorningReviewPackage, ReviewPackageItem, StudentGrowthProfile, StudentGrowthTrend, TeacherWorkbenchData } from '@/types';
import { getTeachingPointsByCategory, getPracticeSuggestionsByStudent } from './storage';

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
    const categories = wa.missingCategories && wa.missingCategories.length > 0 ? wa.missingCategories : [wa.missingCategory];
    categories.forEach(cat => {
      if (wrongByCategory[cat] !== undefined) {
        wrongByCategory[cat]++;
      }
    });
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
  const categoryMap = new Map<MissingCategory, WrongAnswer[]>();
  
  wrongAnswers.forEach(wa => {
    const categories = wa.missingCategories && wa.missingCategories.length > 0 ? wa.missingCategories : [wa.missingCategory];
    categories.forEach(cat => {
      const existing = categoryMap.get(cat) || [];
      existing.push(wa);
      categoryMap.set(cat, existing);
    });
  });
  
  const totalCounts = Array.from(categoryMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  
  return Array.from(categoryMap.entries())
    .map(([category, answers]) => ({
      category,
      categoryName: getCategoryName(category),
      count: answers.length,
      percentage: totalCounts > 0 ? Math.round((answers.length / totalCounts) * 100) : 0,
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
    const categories = wa.missingCategories && wa.missingCategories.length > 0 ? wa.missingCategories : [wa.missingCategory];
    categories.forEach(cat => {
      if (wrongByCategory[cat] !== undefined) {
        wrongByCategory[cat]++;
      }
    });
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

const getSuggestedSpeech = (category: MissingCategory, count: number, percentage: number): string => {
  const categoryName = getCategoryName(category);
  const teachingPoints = getTeachingPointsByCategory(category);
  
  if (percentage >= 40) {
    return `各位同学，今天我们重点讲一下"${categoryName}"这个环节。全班共有${count}人次在这个地方出错，占比${percentage}%，属于需要大家重点掌握的共性问题。首先，${teachingPoints[0]}。其次，${teachingPoints[1]}。大家在后续练习中一定要注意这几点，别再犯同样的错误了。`;
  } else if (percentage >= 20) {
    return `"${categoryName}"方面有${count}人次出错，占比${percentage}%，需要加强练习。核心要点：${teachingPoints.slice(0, 2).join('；')}。`;
  }
  return `"${categoryName}"出错${count}次（${percentage}%），重点：${teachingPoints[0]}。`;
};

export const generateMorningReviewPackage = (
  students: Student[],
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[]
): MorningReviewPackage => {
  const categoryReviews = getCategoryReviews(wrongAnswers);
  const activeStudents = students.filter(s => s.isActive);
  
  const commonProblems: ReviewPackageItem[] = categoryReviews
    .filter(cr => cr.count > 0)
    .map(cr => {
      const relatedCasesMap = new Map<string, { caseId: string; caseTitle: string; count: number }>();
      const relatedStudentsMap = new Map<string, { studentId: string; studentName: string; count: number }>();
      
      cr.wrongAnswers.forEach(wa => {
        const caseKey = wa.caseId;
        const existingCase = relatedCasesMap.get(caseKey);
        if (existingCase) {
          existingCase.count++;
        } else {
          relatedCasesMap.set(caseKey, { caseId: wa.caseId, caseTitle: wa.caseTitle, count: 1 });
        }
        
        const studentKey = wa.studentId;
        const existingStudent = relatedStudentsMap.get(studentKey);
        if (existingStudent) {
          existingStudent.count++;
        } else {
          relatedStudentsMap.set(studentKey, { studentId: wa.studentId, studentName: wa.studentName, count: 1 });
        }
      });
      
      return {
        category: cr.category,
        categoryName: cr.categoryName,
        count: cr.count,
        percentage: cr.percentage,
        relatedCases: Array.from(relatedCasesMap.values()).sort((a, b) => b.count - a.count).slice(0, 5),
        relatedStudents: Array.from(relatedStudentsMap.values()).sort((a, b) => b.count - a.count).slice(0, 5),
        teachingPoints: cr.teachingPoints,
        suggestedSpeech: getSuggestedSpeech(cr.category, cr.count, cr.percentage),
        wrongAnswerExamples: cr.wrongAnswers.slice(0, 3)
      };
    });
  
  const individualFocus = activeStudents.map(student => {
    const stats = getStudentStats(student.id, wrongAnswers, practiceScores, recordResults);
    const weakestCategories = stats.categoryReviews.slice(0, 3);
    const suggestions: string[] = [];
    
    if (weakestCategories.length > 0) {
      suggestions.push(`重点加强"${weakestCategories[0].categoryName}"的话术练习`);
    }
    if (stats.averageRecordScore < 70 && stats.recordCount > 0) {
      suggestions.push('随访记录写作需要多加练习，注意结构完整性');
    }
    if (stats.practiceCount < 3) {
      suggestions.push('整体练习量不足，建议本周完成至少3个病例的完整练习');
    }
    if (weakestCategories.length > 1) {
      suggestions.push(`其次关注"${weakestCategories[1].categoryName}"环节`);
    }
    if (suggestions.length === 0) {
      suggestions.push('整体表现良好，继续保持并挑战更高难度');
    }
    
    return {
      student,
      weakestCategories,
      practiceSuggestions: suggestions
    };
  }).sort((a, b) => b.weakestCategories.length - a.weakestCategories.length);
  
  return {
    date: new Date().toISOString().split('T')[0],
    commonProblems,
    individualFocus,
    totalWrongCount: wrongAnswers.length,
    studentCount: activeStudents.length
  };
};

export const generateStudentGrowthProfile = (
  student: Student,
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[]
): StudentGrowthProfile => {
  const studentWrongAnswers = wrongAnswers.filter(w => w.studentId === student.id);
  const studentScores = practiceScores.filter(s => s.studentId === student.id).sort((a, b) => a.timestamp - b.timestamp);
  const studentRecords = recordResults.filter(r => r.studentId === student.id).sort((a, b) => a.timestamp - b.timestamp);
  const stats = getStudentStats(student.id, wrongAnswers, practiceScores, recordResults);
  
  const last10Days = Array.from({ length: 10 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (9 - i));
    return date.toISOString().split('T')[0].slice(5);
  });
  
  const trend: StudentGrowthTrend = {
    dates: last10Days,
    dialogueScores: last10Days.map(date => {
      const dayScores = studentScores.filter(s => new Date(s.timestamp).toISOString().split('T')[0].slice(5) === date);
      return dayScores.length > 0 ? Math.round(dayScores.reduce((sum, s) => sum + s.totalScore, 0) / dayScores.length) : 0;
    }),
    recordScores: last10Days.map(date => {
      const dayRecords = studentRecords.filter(r => new Date(r.timestamp).toISOString().split('T')[0].slice(5) === date);
      return dayRecords.length > 0 ? Math.round(dayRecords.reduce((sum, r) => sum + r.totalScore, 0) / dayRecords.length) : 0;
    }),
    correctRates: last10Days.map(date => {
      const dayScores = studentScores.filter(s => new Date(s.timestamp).toISOString().split('T')[0].slice(5) === date);
      return dayScores.length > 0 ? Math.round(dayScores.reduce((sum, s) => sum + s.correctRate, 0) / dayScores.length) : 0;
    })
  };
  
  const sectionMissingCounts: Record<RecordSection, number> = {
    basic_info: 0, chief_complaint: 0, present_illness: 0,
    oral_exam: 0, guidance: 0, recheck_plan: 0
  };
  studentRecords.forEach(r => {
    r.missingSections.forEach(section => {
      if (sectionMissingCounts[section] !== undefined) {
        sectionMissingCounts[section]++;
      }
    });
  });
  
  const frequentMissingSections = (Object.entries(sectionMissingCounts) as [RecordSection, number][])
    .filter(([, count]) => count > 0)
    .map(([section, count]) => ({
      section,
      sectionName: getSectionName(section),
      count
    }))
    .sort((a, b) => b.count - a.count);
  
  const recentScores = studentScores.slice(-5);
  const earlierScores = studentScores.slice(0, -5);
  const recentAvg = recentScores.length > 0 ? recentScores.reduce((sum, s) => sum + s.totalScore, 0) / recentScores.length : 0;
  const earlierAvg = earlierScores.length > 0 ? earlierScores.reduce((sum, s) => sum + s.totalScore, 0) / earlierScores.length : 0;
  const improvement = earlierAvg > 0 ? Math.round(recentAvg - earlierAvg) : 0;
  
  return {
    student,
    overallTrend: trend,
    recentPractices: studentScores.slice(-10).reverse(),
    recentRecords: studentRecords.slice(-10).reverse(),
    frequentWrongCategories: stats.categoryReviews.slice(0, 5),
    frequentMissingSections,
    practiceSuggestions: getPracticeSuggestionsByStudent(student.id),
    totalDialoguePractices: studentScores.length,
    totalRecordPractices: studentRecords.length,
    averageDialogueScore: stats.averageScore,
    averageRecordScore: stats.averageRecordScore,
    improvement
  };
};

export const generateTeacherWorkbenchData = (
  students: Student[],
  wrongAnswers: WrongAnswer[],
  practiceScores: PracticeScore[],
  recordResults: RecordTrainingResult[]
): TeacherWorkbenchData => {
  const categoryReviews = getCategoryReviews(wrongAnswers);
  const highFrequencyProblems = categoryReviews.filter(cr => cr.count >= 2).slice(0, 5);
  
  const activeStudents = students.filter(s => s.isActive);
  const focusStudents = activeStudents.map(student => {
    const stats = getStudentStats(student.id, wrongAnswers, practiceScores, recordResults);
    const studentWrongAnswers = wrongAnswers.filter(w => w.studentId === student.id);
    const categoryMap = new Map<MissingCategory, number>();
    studentWrongAnswers.forEach(wa => {
      const categories = wa.missingCategories && wa.missingCategories.length > 0 ? wa.missingCategories : [wa.missingCategory];
      categories.forEach(cat => {
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
    });
    let weakestCategory: MissingCategory = 'other';
    let maxCount = 0;
    categoryMap.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        weakestCategory = cat;
      }
    });
    
    const studentScores = practiceScores.filter(s => s.studentId === student.id);
    const recentScore = studentScores.length > 0 ? Math.round(studentScores.reduce((sum, s) => sum + s.totalScore, 0) / studentScores.length) : 0;
    
    return {
      student,
      wrongCount: studentWrongAnswers.length,
      weakestCategory,
      recentScore
    };
  }).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 6);
  
  const recentRecordPerformance = activeStudents.map(student => {
    const studentRecords = recordResults.filter(r => r.studentId === student.id).sort((a, b) => b.timestamp - a.timestamp);
    const lastRecord = studentRecords[0] || null;
    
    const recentRecords = studentRecords.slice(0, 3);
    const earlierRecords = studentRecords.slice(3, 6);
    const recentAvg = recentRecords.length > 0 ? recentRecords.reduce((sum, r) => sum + r.totalScore, 0) / recentRecords.length : 0;
    const earlierAvg = earlierRecords.length > 0 ? earlierRecords.reduce((sum, r) => sum + r.totalScore, 0) / earlierRecords.length : 0;
    const improvement = earlierAvg > 0 ? Math.round(recentAvg - earlierAvg) : 0;
    
    return {
      student,
      lastRecord,
      improvement
    };
  }).sort((a, b) => {
    if (!a.lastRecord && !b.lastRecord) return 0;
    if (!a.lastRecord) return 1;
    if (!b.lastRecord) return -1;
    return a.improvement - b.improvement;
  }).slice(0, 6);
  
  const todayMorningReview = generateMorningReviewPackage(students, wrongAnswers, practiceScores, recordResults);
  
  return {
    date: new Date().toISOString().split('T')[0],
    highFrequencyProblems,
    focusStudents,
    recentRecordPerformance,
    todayMorningReview
  };
};

export const filterWrongAnswers = (
  wrongAnswers: WrongAnswer[],
  filters: {
    caseId?: string | null;
    studentId?: string | null;
    category?: MissingCategory | null;
    dateRange?: 'all' | 'today' | 'week' | 'month';
  }
): WrongAnswer[] => {
  let filtered = [...wrongAnswers];
  
  if (filters.caseId) {
    filtered = filtered.filter(wa => wa.caseId === filters.caseId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(wa => wa.studentId === filters.studentId);
  }
  
  if (filters.category) {
    filtered = filtered.filter(wa => {
      const categories = wa.missingCategories && wa.missingCategories.length > 0 ? wa.missingCategories : [wa.missingCategory];
      return categories.includes(filters.category!);
    });
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
    
    filtered = filtered.filter(wa => wa.timestamp >= startDate.getTime());
  }
  
  return filtered;
};

export const filterRecordResults = (
  recordResults: RecordTrainingResult[],
  filters: {
    caseId?: string | null;
    studentId?: string | null;
    dateRange?: 'all' | 'today' | 'week' | 'month';
  }
): RecordTrainingResult[] => {
  let filtered = [...recordResults];
  
  if (filters.caseId) {
    filtered = filtered.filter(r => r.caseId === filters.caseId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(r => r.studentId === filters.studentId);
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
    
    filtered = filtered.filter(r => r.timestamp >= startDate.getTime());
  }
  
  return filtered;
};

export const getFilterOptions = (
  wrongAnswers: WrongAnswer[],
  recordResults: RecordTrainingResult[],
  students: Student[]
) => {
  const caseMap = new Map<string, string>();
  wrongAnswers.forEach(wa => caseMap.set(wa.caseId, wa.caseTitle));
  recordResults.forEach(r => caseMap.set(r.caseId, r.caseTitle));
  const caseOptions = Array.from(caseMap.entries()).map(([id, title]) => ({ id, title }));
  
  const categoryOptions = (['brushing', 'floss', 'sensitivity', 'recheck', 'diet', 'hygiene', 'symptom', 'emotional', 'other'] as MissingCategory[]).map(cat => ({
    id: cat,
    name: getCategoryName(cat)
  }));
  
  return {
    caseOptions,
    studentOptions: students.map(s => ({ id: s.id, name: s.name })),
    categoryOptions
  };
};

