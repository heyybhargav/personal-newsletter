'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Plus, Clock, FileText, ArrowDown } from 'lucide-react';

const steps = [
    {
        id: "01",
        title: "Curate your feed.",
        description: "Add any source—YouTube channels, Substack newsletters, or Nitter. We normalize the chaos into one clean stream.",
        icon: Plus,
        color: "bg-blue-500",
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-64 space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200/50">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs">YT</div>
                        <div className="h-2 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200/50">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs">RSS</div>
                        <div className="h-2 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-[#FF5700] shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs">
                            <Plus className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">Add Source...</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "02",
        title: "Set your schedule.",
        description: "Your inbox, your time. Choose exactly when you want your briefing. 8 AM coffee? 6 PM commute? You decide.",
        icon: Clock,
        color: "bg-orange-500",
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-64 bg-[#1A1A1A] text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                    <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">Delivery Time</div>
                    <div className="text-5xl font-serif font-medium">08:00</div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-[#FF5700]"></div>
                    </div>
                    <div className="flex justify-between w-full text-xs text-gray-500 font-mono">
                        <span>AM</span>
                        <span>PM</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "03",
        title: "Receive the Signal.",
        description: "One email, every day. Synthesized intelligence, not just links. Read less, know more.",
        icon: FileText,
        color: "bg-green-500",
        visual: (
            <div className="relative w-full h-full flex items-center justify-center perspective-1000">
                <div className="w-64 bg-[#FDFBF7] p-6 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-200 rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-500">
                    <div className="h-4 w-4 bg-[#FF5700] rounded-sm mb-4"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-2">
                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                        <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }
];

export default function HowItWorks() {
    return (
        <section className="py-32 bg-[#FAF9F6] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-24 md:text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#1A1A1A] mb-6">
                        Designed for focus.
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        A simple, linear process to reclaim your attention span.
                    </p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-px bg-gray-200 transform md:-translate-x-1/2" />

                    <div className="space-y-24 md:space-y-32">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7 }}
                                className={`relative flex flex-col md:flex-row gap-8 md:gap-16 items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Center Node */}
                                <div className="absolute left-0 md:left-1/2 w-14 h-14 rounded-full bg-white border-4 border-[#FAF9F6] shadow-sm flex items-center justify-center transform md:-translate-x-1/2 z-10">
                                    <div className="w-3 h-3 bg-[#FF5700] rounded-full" />
                                </div>

                                {/* Content Side */}
                                <div className="pl-20 md:pl-0 flex-1 text-left md:text-right">
                                    <div className={`md:max-w-md ${i % 2 !== 0 ? 'md:ml-auto md:text-right' : 'md:mr-auto md:text-left'}`}>
                                        <span className="text-sm font-mono font-bold text-[#FF5700] mb-2 block tracking-widest">{step.id}</span>
                                        <h3 className="text-3xl font-serif font-medium text-[#1A1A1A] mb-4">{step.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
                                    </div>
                                </div>

                                {/* Visual Side */}
                                <div className="pl-20 md:pl-0 flex-1 w-full">
                                    <div className={`w-full aspect-[4/3] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden md:max-w-md flex items-center justify-center mx-auto ${i % 2 !== 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                                        {step.visual}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
