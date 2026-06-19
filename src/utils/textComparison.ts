import type { RecordSection } from '@/types';

const SECTION_RULES: { section: RecordSection; keywords: string[] }[] = [
  { section: 'basic_info', keywords: ['患者', '姓名', '性别', '年龄', '编号', '联系方式'] },
  { section: 'chief_complaint', keywords: ['主诉', '因', '要求', '诉求'] },
  { section: 'present_illness', keywords: ['现病史', '病史', '近', '症状', '发病', '既往史'] },
  { section: 'oral_exam', keywords: ['口腔检查', '检查', '探诊', '牙石', '牙龈', '出血', '牙周', '探诊深度'] },
  { section: 'guidance', keywords: ['指导', '口腔卫生', '刷牙', '牙线', '巴氏', '饮食', '注意事项'] },
  { section: 'recheck_plan', keywords: ['复诊', '复查', '定期', '下次', '随访', '建议'] }
];

const SECTION_NAMES: Record<RecordSection, string> = {
  basic_info: '患者基本信息',
  chief_complaint: '主诉',
  present_illness: '现病史',
  oral_exam: '口腔检查',
  guidance: '护理指导',
  recheck_plan: '复诊计划'
};

export const getSectionName = (section: RecordSection): string => SECTION_NAMES[section] || '其他';

const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};

export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const clean1 = text1.replace(/\s+/g, '').toLowerCase();
  const clean2 = text2.replace(/\s+/g, '').toLowerCase();
  
  if (clean1.length === 0 && clean2.length === 0) return 100;
  if (clean1.length === 0 || clean2.length === 0) return 0;
  
  const distance = levenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(Math.max(0, Math.min(100, similarity)));
};

export const calculateKeywordMatch = (
  userText: string,
  keyPoints: string[]
): { score: number; matched: string[]; missing: string[] } => {
  const matched: string[] = [];
  const missing: string[] = [];
  
  keyPoints.forEach(point => {
    if (userText.includes(point) || 
        point.split(/[，、（）()]/).some(part => part.length > 2 && userText.includes(part))) {
      matched.push(point);
    } else {
      missing.push(point);
    }
  });
  
  const score = keyPoints.length > 0 
    ? Math.round((matched.length / keyPoints.length) * 100) 
    : 100;
  
  return { score, matched, missing };
};

export const checkStructuralCompleteness = (text: string): {
  score: number;
  hasStructure: boolean;
  missingSections: RecordSection[];
  presentSections: RecordSection[];
} => {
  const missingSections: RecordSection[] = [];
  const presentSections: RecordSection[] = [];
  
  SECTION_RULES.forEach(rule => {
    const found = rule.keywords.some(keyword => text.includes(keyword));
    if (found) {
      presentSections.push(rule.section);
    } else {
      missingSections.push(rule.section);
    }
  });
  
  const hasStructure = presentSections.length > 0;
  const score = Math.round((presentSections.length / SECTION_RULES.length) * 100);
  
  return { score, hasStructure, missingSections, presentSections };
};

export const calculateRecordScore = (
  userRecord: string,
  referenceRecord: string,
  keyPoints: string[]
): {
  totalScore: number;
  textSimilarity: number;
  keywordScore: number;
  structureScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSections: RecordSection[];
  presentSections: RecordSection[];
} => {
  const textSimilarity = calculateTextSimilarity(userRecord, referenceRecord);
  const { score: keywordScore, matched: matchedKeywords, missing: missingKeywords } = 
    calculateKeywordMatch(userRecord, keyPoints);
  const { score: structureScore, missingSections, presentSections } = checkStructuralCompleteness(userRecord);
  
  const totalScore = Math.round(
    keywordScore * 0.5 + 
    textSimilarity * 0.25 + 
    structureScore * 0.25
  );
  
  return {
    totalScore,
    textSimilarity,
    keywordScore,
    structureScore,
    matchedKeywords,
    missingKeywords,
    missingSections,
    presentSections
  };
};

export const highlightDifferences = (
  userText: string,
  referenceText: string
): { userHighlighted: string; referenceHighlighted: string } => {
  const userWords = userText.split(/([，。、；：\n])/);
  const refWords = referenceText.split(/([，。、；：\n])/);
  
  const userHighlighted = userWords.map(word => {
    if (!referenceText.includes(word) && word.trim().length > 1) {
      return `<span class="bg-red-100 text-red-700 px-1 rounded">${word}</span>`;
    }
    return word;
  }).join('');
  
  const referenceHighlighted = refWords.map(word => {
    if (!userText.includes(word) && word.trim().length > 1) {
      return `<span class="bg-green-100 text-green-700 px-1 rounded">${word}</span>`;
    }
    return word;
  }).join('');
  
  return { userHighlighted, referenceHighlighted };
};

