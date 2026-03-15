'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
    message: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export function Toast({ message, description, type = 'success', onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-[#FF5700]" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success':
                return 'border-l-green-500';
            case 'error':
                return 'border-l-red-500';
            case 'info':
            default:
                return 'border-l-[#FF5700]';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-[100]"
            >
                <div className={`flex items-start gap-3 p-4 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-gray-100 bg-white min-w-[320px] max-w-sm border-l-4 ${getBorderColor()}`}>
                    <div className="flex-none mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-[#1A1A1A] font-serif">{message}</h4>
                        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
                    </div>
                    <button 
                        onClick={() => setIsVisible(false)} 
                        className="text-gray-400 hover:text-black transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
