import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  size = 'md',
}) => {
  const computedMaxWidth =
    maxWidth ||
    (size === 'sm'
      ? 'max-w-md'
      : size === 'lg'
      ? 'max-w-2xl'
      : size === 'xl'
      ? 'max-w-4xl'
      : 'max-w-lg');
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full ${computedMaxWidth} max-h-[85vh] overflow-hidden`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
                <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[#21262d] text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(85vh-65px)]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
