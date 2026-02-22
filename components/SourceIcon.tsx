
import {
    Youtube, Mic, Newspaper, MessageSquare, Mail, FileText, Hash, Github, Rss, Bookmark, Instagram, X
} from 'lucide-react';

export const SourceIcon = ({ type, className = "w-4 h-4" }: { type: string, className?: string }) => {
    switch (type) {
        case 'youtube': return <Youtube className={className} />;
        case 'podcast': return <Mic className={className} />;
        case 'news': return <Newspaper className={className} />;
        case 'reddit': return <MessageSquare className={className} />;
        case 'substack': return <Mail className={className} />;
        case 'medium': return <FileText className={className} />;
        case 'hackernews': return <Hash className={className} />;
        case 'github': return <Github className={className} />;
        case 'github': return <Github className={className} />;
        case 'twitter': return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        );
        case 'x': return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        );
        case 'instagram': return <Instagram className={className} />;
        case 'newsletter': return <Mail className={className} />;
        case 'blog': return <Newspaper className={className} />;
        case 'rss': return <Rss className={className} />;
        default: return <Bookmark className={className} />;
    }
};
