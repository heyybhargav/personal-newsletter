'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

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

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border border-gray-100 bg-white min-w-[300px] max-w-sm ${type === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-[#FF5700]'}`}>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{message}</h4>
                    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                </div>
                <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-black transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
