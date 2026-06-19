import type { UserData, WrongAnswer, PracticeScore, RecordTrainingResult, Student, MissingCategory, StudentPracticeSuggestion, MorningReviewChecklist, MorningReviewChecklistItem, TeacherComment } from '@/types';

const STORAGE_KEY = 'dental-followup-training-data';

const mockStudents: Student[] = [
  { id: 'stu-001', name: '张小梅', joinDate: Date.now() - 30 * 24 * 60 * 60 * 1000, isActive: true },
  { id: 'stu-002', name: '李建国', joinDate: Date.now() - 28 * 24 * 60 * 60 * 1000, isActive: true },
  { id: 'stu-003', name: '王丽娜', joinDate: Date.now() - 25 * 24 * 60 * 60 * 1000, isActive: true },
  { id: 'stu-004', name: '陈志华', joinDate: Date.now() - 22 * 24 * 60 * 60 * 1000, isActive: true },
  { id: 'stu-005', name: '刘婷婷', joinDate: Date.now() - 20 * 24 * 60 * 60 * 1000, isActive: true },
  { id: 'stu-006', name: '赵雨萱', joinDate: Date.now() - 18 * 24 * 60 * 60 * 1000, isActive: true }
];

const defaultUserData: UserData = {
  id: 'user-' + Date.now(),
  name: '带教老师',
  role: 'teacher',
  practiceScores: [],
  wrongAnswers: [],
  recordTrainingResults: [],
  practiceSuggestions: [],
  morningReviewChecklists: [],
  teacherComments: [],
  currentStudentId: 'stu-001',
  students: mockStudents
};

export const getUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...defaultUserData,
        ...parsed,
        students: parsed.students || mockStudents
      };
    }
  } catch (e) {
    console.error('Failed to load user data:', e);
  }
  return { ...defaultUserData, id: 'user-' + Date.now() };
};

export const saveUserData = (data: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
};

export const getCurrentStudent = (): Student => {
  const userData = getUserData();
  return userData.students.find(s => s.id === userData.currentStudentId) || userData.students[0];
};

export const setCurrentStudent = (studentId: string): void => {
  const userData = getUserData();
  userData.currentStudentId = studentId;
  saveUserData(userData);
};

export const detectMissingCategories = (missingPoints: string[]): MissingCategory[] => {
  const categories: Set<MissingCategory> = new Set();
  const missingStr = missingPoints.join('');
  
  if (missingStr.includes('刷牙') || missingStr.includes('巴氏')) categories.add('brushing');
  if (missingStr.includes('牙线') || missingStr.includes('牙缝')) categories.add('floss');
  if (missingStr.includes('敏感') || missingStr.includes('敏感期')) categories.add('sensitivity');
  if (missingStr.includes('复诊') || missingStr.includes('复查')) categories.add('recheck');
  if (missingStr.includes('饮食') || missingStr.includes('食物') || missingStr.includes('冷') || missingStr.includes('热')) categories.add('diet');
  if (missingStr.includes('口腔卫生') || missingStr.includes('漱口') || missingStr.includes('刷牙习惯')) categories.add('hygiene');
  if (missingStr.includes('症状') || missingStr.includes('出血') || missingStr.includes('疼痛')) categories.add('symptom');
  if (missingStr.includes('情绪') || missingStr.includes('安抚') || missingStr.includes('理解') || missingStr.includes('担心')) categories.add('emotional');
  
  if (categories.size === 0) categories.add('other');
  return Array.from(categories);
};

export const addWrongAnswer = (wrongAnswer: Omit<WrongAnswer, 'id' | 'timestamp' | 'studentId' | 'studentName' | 'missingCategories' | 'missingPoints'> & { missingPoints: string[] }): void => {
  const userData = getUserData();
  const currentStudent = getCurrentStudent();
  const missingCategories = detectMissingCategories(wrongAnswer.missingPoints);
  
  const newWrongAnswer: WrongAnswer = {
    ...wrongAnswer,
    missingCategories,
    missingCategory: missingCategories[0] || 'other',
    id: 'wrong-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    studentId: currentStudent.id,
    studentName: currentStudent.name
  };
  userData.wrongAnswers.unshift(newWrongAnswer);
  saveUserData(userData);
};

export const addPracticeScore = (score: Omit<PracticeScore, 'timestamp' | 'studentId' | 'studentName'>): void => {
  const userData = getUserData();
  const currentStudent = getCurrentStudent();
  const newScore: PracticeScore = {
    ...score,
    timestamp: Date.now(),
    studentId: currentStudent.id,
    studentName: currentStudent.name
  };
  userData.practiceScores.unshift(newScore);
  saveUserData(userData);
};

export const addRecordTrainingResult = (result: Omit<RecordTrainingResult, 'id' | 'timestamp' | 'studentId' | 'studentName'>): void => {
  const userData = getUserData();
  const currentStudent = getCurrentStudent();
  const newResult: RecordTrainingResult = {
    ...result,
    id: 'record-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    studentId: currentStudent.id,
    studentName: currentStudent.name
  };
  userData.recordTrainingResults.unshift(newResult);
  saveUserData(userData);
};

export const getLastRecordTrainingResult = (caseId: string, studentId?: string): RecordTrainingResult | null => {
  const userData = getUserData();
  let results = userData.recordTrainingResults.filter(r => r.caseId === caseId);
  if (studentId) {
    results = results.filter(r => r.studentId === studentId);
  }
  return results.length > 0 ? results[0] : null;
};

export const getRecordTrainingResultsByCase = (caseId: string, studentId?: string): RecordTrainingResult[] => {
  const userData = getUserData();
  let results = userData.recordTrainingResults.filter(r => r.caseId === caseId);
  if (studentId) {
    results = results.filter(r => r.studentId === studentId);
  }
  return results;
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const clearWrongAnswers = (): void => {
  const userData = getUserData();
  userData.wrongAnswers = [];
  saveUserData(userData);
};

export const getBestScoreForCase = (caseId: string, studentId?: string): number | null => {
  const userData = getUserData();
  let caseScores = userData.practiceScores.filter(s => s.caseId === caseId);
  if (studentId) {
    caseScores = caseScores.filter(s => s.studentId === studentId);
  }
  if (caseScores.length === 0) return null;
  return Math.max(...caseScores.map(s => s.totalScore));
};

export const isCaseCompleted = (caseId: string, studentId?: string): boolean => {
  const userData = getUserData();
  let caseScores = userData.practiceScores.filter(s => s.caseId === caseId);
  if (studentId) {
    caseScores = caseScores.filter(s => s.studentId === studentId);
  }
  return caseScores.length > 0;
};

export const getPracticeCountByCase = (caseId: string, studentId?: string): number => {
  const userData = getUserData();
  let caseScores = userData.practiceScores.filter(s => s.caseId === caseId);
  if (studentId) {
    caseScores = caseScores.filter(s => s.studentId === studentId);
  }
  return caseScores.length;
};

export const getRecordCountByCase = (caseId: string, studentId?: string): number => {
  const userData = getUserData();
  let caseRecords = userData.recordTrainingResults.filter(r => r.caseId === caseId);
  if (studentId) {
    caseRecords = caseRecords.filter(r => r.studentId === studentId);
  }
  return caseRecords.length;
};

export const getTeachingPointsByCategory = (category: MissingCategory): string[] => {
  const teachingPointsMap: Record<MissingCategory, string[]> = {
    brushing: [
      '巴氏刷牙法要点：刷毛与牙面呈45度角，小幅度水平颤动',
      '每次刷牙不少于2分钟，早晚各一次',
      '牙刷选择：软毛、小头，每3个月更换一次',
      '重点清洁牙龈缘和牙颈部，避免用力横刷',
      '可配合使用电动牙刷，提高清洁效率'
    ],
    floss: [
      '牙线使用方法：取约30cm牙线，两端缠绕中指',
      '用拇指和食指绷紧牙线，轻轻嵌入牙缝',
      '沿牙面上下刮动，避免用力拉扯损伤牙龈',
      '每个牙缝要清洁两个邻面，每日至少一次',
      '对于牙缝较大者，可使用牙缝刷替代'
    ],
    sensitivity: [
      '术后敏感期：一般持续1-2周，严重者可达4-6周',
      '常见症状：冷热刺激痛、酸甜敏感、咬合不适',
      '处理建议：使用抗敏感牙膏，避免过冷过热饮食',
      '如症状持续加重，需及时复诊排查其他问题',
      '术前告知可降低患者术后焦虑，提高依从性'
    ],
    recheck: [
      '普通洁治后：每6个月复查一次',
      '牙周炎患者：每3个月复查一次',
      '复诊内容：牙周探诊、菌斑控制评估、必要时复洁治',
      '建立复诊提醒机制，可通过电话或短信通知',
      '多次不按时复诊需重点强调牙周病进展风险'
    ],
    diet: [
      '洁治后2小时内避免进食，24小时内避免过冷过热',
      '减少含糖食物和饮料的摄入频率',
      '避免饮用咖啡、茶、可乐等易染色饮品',
      '多吃富含纤维的食物，有助于牙齿自洁',
      '戒烟限酒，减少对牙周组织的刺激'
    ],
    hygiene: [
      '每日早晚刷牙+每日一次牙线是基础',
      '可配合使用漱口水，但不能替代机械清洁',
      '舌面清洁也很重要，可使用刮舌器',
      '义齿佩戴者需注意义齿清洁和夜间摘下',
      '定期口腔检查+洁治是预防大于治疗的关键'
    ],
    symptom: [
      '洁治后少量牙龈出血属正常现象，一般1-2天消失',
      '牙齿酸软是牙石去除后牙根暴露所致，会逐渐缓解',
      '如出血量大、疼痛剧烈，需立即复诊',
      '术前充分告知可能出现的症状，避免患者恐慌',
      '提供书面注意事项，便于患者术后查阅'
    ],
    emotional: [
      '沟通时用开放式提问，鼓励患者表达顾虑',
      '对焦虑患者可先进行呼吸放松引导',
      '使用共情语言："我理解您的感受，很多人都会有这种担心"',
      '操作前告知每一步会做什么，减少未知恐惧',
      '对儿童患者使用Tell-Show-Do技术，配合表扬奖励'
    ],
    other: [
      '沟通语速适中，避免使用过多专业术语',
      '注意观察患者非语言信号：皱眉、紧张、回避眼神',
      '每次沟通时间控制在10-15分钟，避免信息过载',
      '重要信息重复强调，并让患者复述确认',
      '做好沟通记录，便于后续随访衔接'
    ]
  };
  return teachingPointsMap[category] || teachingPointsMap.other;
};

export const addPracticeSuggestion = (suggestion: Omit<StudentPracticeSuggestion, 'id' | 'createdAt' | 'completed'>): StudentPracticeSuggestion => {
  const userData = getUserData();
  const newSuggestion: StudentPracticeSuggestion = {
    ...suggestion,
    id: 'sug-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
    completed: false
  };
  userData.practiceSuggestions.push(newSuggestion);
  saveUserData(userData);
  return newSuggestion;
};

export const getPracticeSuggestionsByStudent = (studentId: string): StudentPracticeSuggestion[] => {
  const userData = getUserData();
  return userData.practiceSuggestions.filter(s => s.studentId === studentId).sort((a, b) => b.createdAt - a.createdAt);
};

export const toggleSuggestionCompleted = (suggestionId: string): void => {
  const userData = getUserData();
  const suggestion = userData.practiceSuggestions.find(s => s.id === suggestionId);
  if (suggestion) {
    suggestion.completed = !suggestion.completed;
    saveUserData(userData);
  }
};

export const deletePracticeSuggestion = (suggestionId: string): void => {
  const userData = getUserData();
  userData.practiceSuggestions = userData.practiceSuggestions.filter(s => s.id !== suggestionId);
  saveUserData(userData);
};

export const saveMorningReviewChecklist = (checklist: Omit<MorningReviewChecklist, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): MorningReviewChecklist => {
  const userData = getUserData();
  const now = Date.now();
  
  if (checklist.id) {
    const existingIndex = userData.morningReviewChecklists.findIndex(c => c.id === checklist.id);
    if (existingIndex >= 0) {
      userData.morningReviewChecklists[existingIndex] = {
        ...userData.morningReviewChecklists[existingIndex],
        ...checklist,
        updatedAt: now
      };
      saveUserData(userData);
      return userData.morningReviewChecklists[existingIndex];
    }
  }
  
  const newChecklist: MorningReviewChecklist = {
    ...checklist,
    id: 'checklist-' + now + '-' + Math.random().toString(36).substr(2, 9),
    createdAt: now,
    updatedAt: now
  };
  userData.morningReviewChecklists.push(newChecklist);
  saveUserData(userData);
  return newChecklist;
};

export const getMorningReviewChecklistByDate = (date: string): MorningReviewChecklist | null => {
  const userData = getUserData();
  return userData.morningReviewChecklists.find(c => c.date === date) || null;
};

export const updateChecklistItem = (checklistId: string, itemIndex: number, updates: Partial<MorningReviewChecklistItem>): void => {
  const userData = getUserData();
  const checklist = userData.morningReviewChecklists.find(c => c.id === checklistId);
  if (checklist && checklist.items[itemIndex]) {
    checklist.items[itemIndex] = { ...checklist.items[itemIndex], ...updates };
    checklist.updatedAt = Date.now();
    saveUserData(userData);
  }
};

export const addTeacherComment = (comment: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt' | 'followedUp' | 'seenByStudent'>): TeacherComment => {
  const userData = getUserData();
  const now = Date.now();
  const newComment: TeacherComment = {
    ...comment,
    id: 'comment-' + now + '-' + Math.random().toString(36).substr(2, 9),
    createdAt: now,
    updatedAt: now,
    followedUp: false,
    seenByStudent: false
  };
  userData.teacherComments.push(newComment);
  saveUserData(userData);
  return newComment;
};

export const getTeacherCommentsByStudent = (studentId: string): TeacherComment[] => {
  const userData = getUserData();
  return userData.teacherComments
    .filter(c => c.studentId === studentId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getTeacherCommentsByCase = (studentId: string, caseId: string): TeacherComment[] => {
  const userData = getUserData();
  return userData.teacherComments
    .filter(c => c.studentId === studentId && c.caseId === caseId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getLatestUnseenComment = (studentId: string, caseId?: string): TeacherComment | null => {
  const userData = getUserData();
  let comments = userData.teacherComments.filter(c => c.studentId === studentId && !c.seenByStudent && !c.followedUp);
  if (caseId) {
    comments = comments.filter(c => c.caseId === caseId);
  }
  return comments.length > 0 ? comments[0] : null;
};

export const markCommentAsSeen = (commentId: string): void => {
  const userData = getUserData();
  const comment = userData.teacherComments.find(c => c.id === commentId);
  if (comment) {
    comment.seenByStudent = true;
    comment.seenAt = Date.now();
    saveUserData(userData);
  }
};

export const markCommentAsFollowedUp = (commentId: string): void => {
  const userData = getUserData();
  const comment = userData.teacherComments.find(c => c.id === commentId);
  if (comment) {
    comment.followedUp = true;
    comment.followedUpAt = Date.now();
    saveUserData(userData);
  }
};

export const updateTeacherComment = (commentId: string, updates: Partial<TeacherComment>): void => {
  const userData = getUserData();
  const comment = userData.teacherComments.find(c => c.id === commentId);
  if (comment) {
    Object.assign(comment, updates, { updatedAt: Date.now() });
    saveUserData(userData);
  }
};

export const deleteTeacherComment = (commentId: string): void => {
  const userData = getUserData();
  userData.teacherComments = userData.teacherComments.filter(c => c.id !== commentId);
  saveUserData(userData);
};

export const getChecklistStatsForDate = (date: string) => {
  const checklist = getMorningReviewChecklistByDate(date);
  if (!checklist) {
    return { total: 0, selected: 0, completed: 0, remaining: 0 };
  }
  const selectedItems = checklist.items.filter(i => i.selected);
  const completedItems = selectedItems.filter(i => i.completed);
  return {
    total: checklist.items.length,
    selected: selectedItems.length,
    completed: completedItems.length,
    remaining: selectedItems.length - completedItems.length
  };
};

