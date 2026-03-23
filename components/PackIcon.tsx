
import { Globe, Zap, TrendingUp, Atom, Palette, Bot, Briefcase, Code, Cpu } from 'lucide-react';

export const PackIcon = ({ icon, className }: { icon: string, className?: string }) => {
    const Icons: any = {
        Globe, Zap, TrendingUp, Atom, Palette, Bot, Briefcase, Code, Cpu
    };
    const Icon = Icons[icon] || Globe;
    return <Icon className={className} />;
};
