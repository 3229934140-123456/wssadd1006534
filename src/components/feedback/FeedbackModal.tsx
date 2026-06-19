import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Feedback } from '@/types';
import { getMissingCategoryChinese, getMissingCategoryColor } from '@/utils/scoring';
import { determineMissingCategory } from '@/utils/scoring';
import type { StepName } from '@/types';

interface FeedbackModalProps {
  isOpen: boolean;
  feedback: Feedback | null;
  stepName: StepName;
  onClose: () => void;
}

export const FeedbackModal = ({
  isOpen,
  feedback,
  stepName,
  onClose
}: FeedbackModalProps) => {
  if (!feedback) return null;
  
  const missingCategory = feedback.missingPoints.length > 0 
    ? determineMissingCategory(feedback.missingPoints, stepName)
    : null;
  
  const icons = {
    correct: <CheckCircle className="w-12 h-12 text-green-500" />,
    warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
    error: <XCircle className="w-12 h-12 text-red-500" />
  };
  
  const titles = {
    correct: '太棒了！回答正确',
    warning: '还可以做得更好',
    error: '这个选择不太合适'
  };
  
  const bgColors = {
    correct: 'from-green-50 to-white',
    warning: 'from-yellow-50 to-white',
    error: 'from-red-50 to-white'
  };
  
  const borderColors = {
    correct: 'border-green-200',
    warning: 'border-yellow-200',
    error: 'border-red-200'
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-gradient-to-b ${bgColors[feedback.type]} rounded-3xl border-2 ${borderColors[feedback.type]} shadow-2xl z-50 overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="flex justify-center mb-6"
              >
                <motion.div
                  animate={feedback.type === 'correct' ? { y: [0, -10, 0] } : { x: [0, -5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {icons[feedback.type]}
                </motion.div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`text-2xl font-bold text-center mb-4 ${
                  feedback.type === 'correct' ? 'text-green-700' :
                  feedback.type === 'warning' ? 'text-yellow-700' : 'text-red-700'
                }`}
              >
                {titles[feedback.type]}
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <p className="text-gray-600 text-center leading-relaxed">
                  {feedback.explanation}
                </p>
                
                {feedback.missingPoints.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">遗漏的关键点：</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.missingPoints.map((point, index) => (
                        <Badge key={index} variant="warning" size="sm">
                          {point}
                        </Badge>
                      ))}
                    </div>
                    {missingCategory && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-gray-500">分类：</span>
                        <Badge 
                          variant="info" 
                          size="sm"
                          style={{ backgroundColor: `${getMissingCategoryColor(missingCategory)}20`, color: getMissingCategoryColor(missingCategory) }}
                        >
                          {getMissingCategoryChinese(missingCategory)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-2">正确话术参考：</p>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    "{feedback.correctSpeech}"
                  </p>
                </div>
              </motion.div>
              
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
