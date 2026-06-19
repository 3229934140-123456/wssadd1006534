import type { DialogueOption, MissingCategory, StepName } from '@/types';

export const calculateMaxScore = (options: DialogueOption[]): number => {
  return Math.max(...options.map(o => o.score));
};

export const determineMissingCategory = (
  missingPoints: string[],
  stepName: StepName
): MissingCategory => {
  const missingStr = missingPoints.join('');
  
  if (missingStr.includes('刷牙') || missingStr.includes('巴氏')) {
    return 'brushing';
  }
  if (missingStr.includes('牙线') || missingStr.includes('牙缝')) {
    return 'floss';
  }
  if (missingStr.includes('敏感') || missingStr.includes('敏感期')) {
    return 'sensitivity';
  }
  if (missingStr.includes('复诊') || missingStr.includes('复查')) {
    return 'recheck';
  }
  if (missingStr.includes('饮食') || missingStr.includes('食物') || missingStr.includes('冷') || missingStr.includes('热')) {
    return 'diet';
  }
  if (missingStr.includes('口腔卫生') || missingStr.includes('漱口') || missingStr.includes('刷牙习惯')) {
    return 'hygiene';
  }
  if (missingStr.includes('症状') || missingStr.includes('出血') || missingStr.includes('疼痛')) {
    return 'symptom';
  }
  if (missingStr.includes('情绪') || missingStr.includes('安抚') || missingStr.includes('理解') || missingStr.includes('担心')) {
    return 'emotional';
  }
  return 'other';
};

export const getStepNameChinese = (stepName: StepName): string => {
  const names: Record<StepName, string> = {
    greeting: '开场问候',
    symptom: '症状询问',
    guidance: '护理指导',
    followup: '复诊建议'
  };
  return names[stepName];
};

export const getMissingCategoryChinese = (category: MissingCategory): string => {
  const names: Record<MissingCategory, string> = {
    brushing: '刷牙方式',
    floss: '牙线使用',
    sensitivity: '敏感期说明',
    recheck: '复诊时机',
    diet: '饮食指导',
    hygiene: '口腔卫生',
    symptom: '症状解释',
    emotional: '情绪安抚',
    other: '其他问题'
  };
  return names[category];
};

export const getMissingCategoryColor = (category: MissingCategory): string => {
  const colors: Record<MissingCategory, string> = {
    brushing: '#1A73E8',
    floss: '#34A853',
    sensitivity: '#FBBC04',
    recheck: '#FF6B6B',
    diet: '#9C27B0',
    hygiene: '#00BCD4',
    symptom: '#E91E63',
    emotional: '#FF9800',
    other: '#9AA0A6'
  };
  return colors[category];
};
