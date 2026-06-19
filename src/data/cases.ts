import type { CaseScene } from '@/types';

export const cases: CaseScene[] = [
  {
    id: 'case-001',
    title: '第一次洗牙后牙齿酸软的年轻患者',
    description: '26岁职场新人，首次接受超声波洁治，术后2天出现牙齿酸软敏感，对冷刺激尤为明显，情绪略显焦虑。',
    patientName: '李小姐',
    age: 26,
    patientPersonality: '性格偏敏感，注重细节，容易焦虑，首次洗牙体验不佳。',
    cleaningRecord: '全口超声波洁治，上下前牙区牙石I度，牙龈轻度红肿，探诊出血(+)，菌斑染色指数60%。洁治后抛光，局部上药。',
    riskPoints: [
      '首次洗牙易产生恐惧心理',
      '牙齿酸软是正常术后反应需耐心解释',
      '需特别说明敏感期时长和护理方法',
      '要强调正确刷牙方式避免加重敏感'
    ],
    difficulty: 2,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20woman%20professional%20portrait%20wearing%20office%20clothes%20gentle%20smile&image_size=square'
  },
  {
    id: 'case-002',
    title: '牙周维护依从性差的中年患者',
    description: '45岁企业管理者，慢性牙周炎患者，每3个月复查但经常爽约，口腔卫生维护不佳，这次随访发现菌斑堆积明显。',
    patientName: '王先生',
    age: 45,
    patientPersonality: '性格强势，时间观念强，自认为刷牙很认真，对医嘱依从性较差。',
    cleaningRecord: '牙周基础治疗后3个月复查，全口菌斑指数75%，后牙区牙龈红肿，探诊深度4-5mm，伴少量出血，牙石少量沉积。',
    riskPoints: [
      '患者不承认自己刷牙不到位',
      '需用客观数据说服而非指责',
      '重点强调牙线和牙缝刷的使用',
      '复诊时间的重要性需要反复强调'
    ],
    difficulty: 3,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20asian%20businessman%20portrait%20wearing%20suit%20confident%20expression&image_size=square'
  },
  {
    id: 'case-003',
    title: '家长代儿童咨询洁治后出血',
    description: '8岁男童，一周前完成首次洁治，家长反映孩子刷牙时牙龈仍有出血，担心是否洁治不当造成损伤。',
    patientName: '张妈妈（代子咨询）',
    age: 38,
    patientPersonality: '爱子心切，容易过度担忧，对儿童口腔知识了解较少，需要耐心科普。',
    cleaningRecord: '8岁儿童，混合牙列，乳磨牙和新萌恒牙菌斑堆积明显，牙龈缘红肿，探诊出血(+)。行全口超声波洁治（低功率）+ 抛光 + 涂氟。',
    riskPoints: [
      '家长担心孩子受伤，需要先安抚情绪',
      '需要解释牙龈炎导致出血而非洁治损伤',
      '要教家长正确的儿童刷牙方法',
      '强调儿童定期洁治的重要性'
    ],
    difficulty: 2,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20mother%20with%28year%20old%20boy%29%20warm%20portrait%20family%20photo&image_size=square'
  }
];

export const getCaseById = (id: string): CaseScene | undefined => {
  return cases.find(c => c.id === id);
};
