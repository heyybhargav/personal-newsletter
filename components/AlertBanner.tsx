"use client";

import { AlertTriangle, MailCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AlertType = 'error' | 'success' | 'info';

interface AlertBannerProps {
    message: string | null;
    type?: AlertType;
    className?: string;
}

export function AlertBanner({ message, type, className = '' }: AlertBannerProps) {
    if (!message) return null;

    // Auto-detect type if not explicitly provided
    let finalType: AlertType = type || 'info';
    if (!type) {
        if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
            finalType = 'error';
        } else if (message.toLowerCase().includes('success') || message.toLowerCase().includes('sent')) {
            finalType = 'success';
        }
    }

    const getStyles = () => {
        switch (finalType) {
            case 'error':
                return 'bg-[#1A1A1A] border-red-900/50 text-red-200';
            case 'success':
                return 'bg-[#1A1A1A] border-green-900/50 text-green-200';
            case 'info':
            default:
                return 'bg-[#1A1A1A] border-gray-700 text-gray-200';
        }
    };

    const getIcon = () => {
        switch (finalType) {
            case 'error':
                return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
            case 'success':
                return <MailCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className={`overflow-hidden ${className}`}
            >
                <div className={`p-4 rounded-lg text-sm border flex items-start gap-3 shadow-sm ${getStyles()}`}>
                    {getIcon()}
                    <div className="flex-1 leading-relaxed font-serif text-[15px]">
                        {message}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
