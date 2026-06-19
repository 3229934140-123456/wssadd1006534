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
  missingSections: string[];
} => {
  const requiredSections = ['患者姓名', '主诉', '现病史', '指导', '复诊'];
  const missingSections: string[] = [];
  
  requiredSections.forEach(section => {
    if (!text.includes(section)) {
      missingSections.push(section);
    }
  });
  
  const hasStructure = requiredSections.some(section => text.includes(section));
  const score = Math.round(((requiredSections.length - missingSections.length) / requiredSections.length) * 100);
  
  return { score, hasStructure, missingSections };
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
  missingSections: string[];
} => {
  const textSimilarity = calculateTextSimilarity(userRecord, referenceRecord);
  const { score: keywordScore, matched: matchedKeywords, missing: missingKeywords } = 
    calculateKeywordMatch(userRecord, keyPoints);
  const { score: structureScore, missingSections } = checkStructuralCompleteness(userRecord);
  
  const totalScore = Math.round(
    keywordScore * 0.6 + 
    textSimilarity * 0.3 + 
    structureScore * 0.1
  );
  
  return {
    totalScore,
    textSimilarity,
    keywordScore,
    structureScore,
    matchedKeywords,
    missingKeywords,
    missingSections
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
