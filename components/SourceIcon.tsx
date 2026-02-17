
import {
    Youtube, Mic, Newspaper, MessageSquare, Mail, FileText, Hash, Github, Twitter, Rss, Bookmark, Instagram
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
        case 'twitter': return <Twitter className={className} />;
        case 'instagram': return <Instagram className={className} />;
        case 'newsletter': return <Mail className={className} />;
        case 'blog': return <Newspaper className={className} />;
        case 'rss': return <Rss className={className} />;
        default: return <Bookmark className={className} />;
    }
};
