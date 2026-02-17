import { SourceType } from './types';


export interface RecommendedSource {
    id: string; // Unique ID for the recommendation system
    name: string;
    type: SourceType;
    url: string; // The feed URL or channel URL
    originalUrl: string; // The public facing URL
    favicon?: string;
    category: SourceCategory;
    description?: string;
}

export type SourceCategory =
    | 'tech_startups'
    | 'finance_markets'
    | 'ai_revolution'
    | 'world_news'
    | 'science_space'
    | 'design_creativity';

export interface StarterPack {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji
    category: string; // e.g. 'tech_startups'
    sources: RecommendedSource[];
}



// --- The Curated Library (High Signal Sources) ---
export const CURATED_LIBRARY: RecommendedSource[] = [

    // ═══════════════════════════════════════
    // TECH & STARTUPS
    // ═══════════════════════════════════════
    {
        id: 'tech_hn',
        name: 'Hacker News',
        type: 'rss',
        url: 'https://news.ycombinator.com/rss',
        originalUrl: 'https://news.ycombinator.com',
        favicon: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64',
        category: 'tech_startups',
        description: 'The front page of the internet for builders.'
    },
    {
        id: 'tech_pg',
        name: 'Paul Graham',
        type: 'rss',
        url: 'http://www.aaronsw.com/2002/feeds/pgessays.rss',
        originalUrl: 'http://paulgraham.com/articles.html',
        favicon: 'https://www.google.com/s2/favicons?domain=paulgraham.com&sz=64',
        category: 'tech_startups',
        description: 'Essays on startups, technology, and life.'
    },
    {
        id: 'tech_verge',
        name: 'The Verge',
        type: 'rss',
        url: 'https://www.theverge.com/rss/index.xml',
        originalUrl: 'https://www.theverge.com',
        favicon: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=64',
        category: 'tech_startups',
        description: 'Technology, science, art, and culture.'
    },
    {
        id: 'tech_tc',
        name: 'TechCrunch',
        type: 'rss',
        url: 'https://techcrunch.com/feed/',
        originalUrl: 'https://techcrunch.com',
        favicon: 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=64',
        category: 'tech_startups',
        description: 'Startup and technology news.'
    },
    {
        id: 'tech_stratechery',
        name: 'Stratechery',
        type: 'rss',
        url: 'https://stratechery.com/feed/',
        originalUrl: 'https://stratechery.com',
        favicon: 'https://www.google.com/s2/favicons?domain=stratechery.com&sz=64',
        category: 'tech_startups',
        description: 'Ben Thompson on strategy and tech business models.'
    },
    {
        id: 'tech_allin',
        name: 'All-In Podcast',
        type: 'podcast',
        url: 'https://feeds.megaphone.fm/all-in-with-chamath-jason-sacks-friedberg',
        originalUrl: 'https://www.allinpodcast.co',
        favicon: 'https://www.google.com/s2/favicons?domain=allinpodcast.co&sz=64',
        category: 'tech_startups',
        description: 'Industry, tech, politics from four billionaire besties.'
    },
    {
        id: 'tech_ycombinator',
        name: 'Y Combinator',
        type: 'youtube',
        url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCxI5-x_s5V2_OqS62_0z-0A',
        originalUrl: 'https://www.youtube.com/@ycombinator',
        favicon: 'https://www.google.com/s2/favicons?domain=ycombinator.com&sz=64',
        category: 'tech_startups',
        description: 'Startup school, founder interviews, and demo days.'
    },
    {
        id: 'tech_r_startups',
        name: 'r/startups',
        type: 'reddit',
        url: 'https://www.reddit.com/r/startups/.rss',
        originalUrl: 'https://www.reddit.com/r/startups',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'tech_startups',
        description: 'Community discussions on building and scaling startups.'
    },

    // ═══════════════════════════════════════
    // FINANCE & MARKETS
    // ═══════════════════════════════════════
    {
        id: 'fin_bloomberg',
        name: 'Bloomberg Markets',
        type: 'rss',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        originalUrl: 'https://www.bloomberg.com',
        favicon: 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=64',
        category: 'finance_markets',
        description: 'Global financial markets and business news.'
    },
    {
        id: 'fin_economist',
        name: 'The Economist',
        type: 'rss',
        url: 'https://www.economist.com/global-business-review/rss.xml',
        originalUrl: 'https://www.economist.com',
        favicon: 'https://www.google.com/s2/favicons?domain=economist.com&sz=64',
        category: 'finance_markets',
        description: 'World news, politics, economics, and business.'
    },
    {
        id: 'fin_wsj',
        name: 'Wall Street Journal',
        type: 'rss',
        url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
        originalUrl: 'https://www.wsj.com',
        favicon: 'https://www.google.com/s2/favicons?domain=wsj.com&sz=64',
        category: 'finance_markets',
        description: 'Breaking news and analysis from global markets.'
    },
    {
        id: 'fin_ft',
        name: 'Financial Times',
        type: 'rss',
        url: 'https://www.ft.com/?format=rss',
        originalUrl: 'https://www.ft.com',
        favicon: 'https://www.google.com/s2/favicons?domain=ft.com&sz=64',
        category: 'finance_markets',
        description: 'Authoritative coverage of global finance.'
    },
    {
        id: 'fin_morningbrew',
        name: 'Morning Brew',
        type: 'newsletter',
        url: 'https://www.morningbrew.com/daily/rss',
        originalUrl: 'https://www.morningbrew.com',
        favicon: 'https://www.google.com/s2/favicons?domain=morningbrew.com&sz=64',
        category: 'finance_markets',
        description: 'Business news explained in plain English.'
    },
    {
        id: 'fin_acquired',
        name: 'Acquired Podcast',
        type: 'podcast',
        url: 'https://feeds.pacific-content.com/acquired',
        originalUrl: 'https://www.acquired.fm',
        favicon: 'https://www.google.com/s2/favicons?domain=acquired.fm&sz=64',
        category: 'finance_markets',
        description: 'Deep dives into great companies and IPOs.'
    },
    {
        id: 'fin_patrickboyle',
        name: 'Patrick Boyle',
        type: 'youtube',
        url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCQ7mOJ1FjImFIh8LUKhjEfg',
        originalUrl: 'https://www.youtube.com/@PBoyle',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'finance_markets',
        description: 'Hedge fund manager explaining finance and economics.'
    },
    {
        id: 'fin_r_investing',
        name: 'r/investing',
        type: 'reddit',
        url: 'https://www.reddit.com/r/investing/.rss',
        originalUrl: 'https://www.reddit.com/r/investing',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'finance_markets',
        description: 'Community discussions on investing and markets.'
    },

    // ═══════════════════════════════════════
    // AI REVOLUTION
    // ═══════════════════════════════════════
    {
        id: 'ai_openai',
        name: 'OpenAI Blog',
        type: 'rss',
        url: 'https://openai.com/blog/rss.xml',
        originalUrl: 'https://openai.com/blog',
        favicon: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64',
        category: 'ai_revolution',
        description: 'Research and product updates from OpenAI.'
    },
    {
        id: 'ai_anthropic',
        name: 'Anthropic Research',
        type: 'rss',
        url: 'https://www.anthropic.com/research/rss.xml',
        originalUrl: 'https://www.anthropic.com/research',
        favicon: 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=64',
        category: 'ai_revolution',
        description: 'Safety-focused AI research and breakthroughs.'
    },
    {
        id: 'ai_deepmind',
        name: 'Google DeepMind',
        type: 'rss',
        url: 'https://deepmind.google/blog/rss.xml',
        originalUrl: 'https://deepmind.google/blog',
        favicon: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=64',
        category: 'ai_revolution',
        description: 'Cutting-edge AI research from DeepMind.'
    },
    {
        id: 'ai_karpathy',
        name: 'Andrej Karpathy',
        type: 'youtube',
        url: 'https://www.youtube.com/@AndrejKarpathy',
        originalUrl: 'https://www.youtube.com/@AndrejKarpathy',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'ai_revolution',
        description: 'Deep learning from first principles.'
    },
    {
        id: 'ai_twomin',
        name: 'Two Minute Papers',
        type: 'youtube',
        url: 'https://www.youtube.com/@TwoMinutePapers',
        originalUrl: 'https://www.youtube.com/@TwoMinutePapers',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'ai_revolution',
        description: 'AI research papers explained in minutes.'
    },
    {
        id: 'ai_tldr',
        name: 'TLDR AI',
        type: 'newsletter',
        url: 'https://tldr.tech/ai/feed',
        originalUrl: 'https://tldr.tech/ai',
        favicon: 'https://www.google.com/s2/favicons?domain=tldr.tech&sz=64',
        category: 'ai_revolution',
        description: 'Daily AI news in 5 minutes.'
    },
    {
        id: 'ai_r_machinelearning',
        name: 'r/MachineLearning',
        type: 'reddit',
        url: 'https://www.reddit.com/r/MachineLearning/.rss',
        originalUrl: 'https://www.reddit.com/r/MachineLearning',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'ai_revolution',
        description: 'Academic ML research and industry discussion.'
    },
    {
        id: 'ai_lexfridman',
        name: 'Lex Fridman Podcast',
        type: 'podcast',
        url: 'https://lexfridman.com/feed/podcast/',
        originalUrl: 'https://lexfridman.com/podcast/',
        favicon: 'https://www.google.com/s2/favicons?domain=lexfridman.com&sz=64',
        category: 'ai_revolution',
        description: 'Long-form conversations on AI, science, and philosophy.'
    },

    // ═══════════════════════════════════════
    // WORLD NEWS
    // ═══════════════════════════════════════
    {
        id: 'world_bbc',
        name: 'BBC News',
        type: 'rss',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        originalUrl: 'https://www.bbc.com/news',
        favicon: 'https://www.google.com/s2/favicons?domain=bbc.com&sz=64',
        category: 'world_news',
        description: 'Trusted global news coverage.'
    },
    {
        id: 'world_reuters',
        name: 'Reuters',
        type: 'rss',
        url: 'https://www.reutersagency.com/feed/',
        originalUrl: 'https://www.reuters.com',
        favicon: 'https://www.google.com/s2/favicons?domain=reuters.com&sz=64',
        category: 'world_news',
        description: 'Wire service. Facts first, fast.'
    },
    {
        id: 'world_aljazeera',
        name: 'Al Jazeera',
        type: 'rss',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        originalUrl: 'https://www.aljazeera.com',
        favicon: 'https://www.google.com/s2/favicons?domain=aljazeera.com&sz=64',
        category: 'world_news',
        description: 'Global perspective from the Middle East.'
    },
    {
        id: 'world_nyt',
        name: 'New York Times',
        type: 'rss',
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        originalUrl: 'https://www.nytimes.com/section/world',
        favicon: 'https://www.google.com/s2/favicons?domain=nytimes.com&sz=64',
        category: 'world_news',
        description: 'In-depth world reporting and analysis.'
    },
    {
        id: 'world_guardian',
        name: 'The Guardian',
        type: 'rss',
        url: 'https://www.theguardian.com/world/rss',
        originalUrl: 'https://www.theguardian.com/world',
        favicon: 'https://www.google.com/s2/favicons?domain=theguardian.com&sz=64',
        category: 'world_news',
        description: 'Independent journalism from London.'
    },
    {
        id: 'world_vox',
        name: 'Vox',
        type: 'rss',
        url: 'https://www.vox.com/rss/index.xml',
        originalUrl: 'https://www.vox.com',
        favicon: 'https://www.google.com/s2/favicons?domain=vox.com&sz=64',
        category: 'world_news',
        description: 'Explainer journalism on policy and culture.'
    },
    {
        id: 'world_r_worldnews',
        name: 'r/worldnews',
        type: 'reddit',
        url: 'https://www.reddit.com/r/worldnews/.rss',
        originalUrl: 'https://www.reddit.com/r/worldnews',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'world_news',
        description: 'Breaking world news from across the globe.'
    },
    {
        id: 'world_johnoliver',
        name: 'Last Week Tonight',
        type: 'youtube',
        url: 'https://www.youtube.com/@LastWeekTonight',
        originalUrl: 'https://www.youtube.com/@LastWeekTonight',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'world_news',
        description: 'Deep dives into current events with John Oliver.'
    },

    // ═══════════════════════════════════════
    // SCIENCE & SPACE
    // ═══════════════════════════════════════
    {
        id: 'sci_nasa',
        name: 'NASA',
        type: 'rss',
        url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
        originalUrl: 'https://www.nasa.gov',
        favicon: 'https://www.google.com/s2/favicons?domain=nasa.gov&sz=64',
        category: 'science_space',
        description: 'Space exploration, discovery, and missions.'
    },
    {
        id: 'sci_nature',
        name: 'Nature',
        type: 'rss',
        url: 'http://feeds.nature.com/nature/rss/current',
        originalUrl: 'https://www.nature.com',
        favicon: 'https://www.google.com/s2/favicons?domain=nature.com&sz=64',
        category: 'science_space',
        description: 'Premier international science journal.'
    },
    {
        id: 'sci_quanta',
        name: 'Quanta Magazine',
        type: 'rss',
        url: 'https://api.quantamagazine.org/feed/',
        originalUrl: 'https://www.quantamagazine.org',
        favicon: 'https://www.google.com/s2/favicons?domain=quantamagazine.org&sz=64',
        category: 'science_space',
        description: 'Math, physics, biology, and computer science stories.'
    },
    {
        id: 'sci_scientificamerican',
        name: 'Scientific American',
        type: 'rss',
        url: 'http://rss.sciam.com/ScientificAmerican-Global',
        originalUrl: 'https://www.scientificamerican.com',
        favicon: 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=64',
        category: 'science_space',
        description: 'Accessible science journalism since 1845.'
    },
    {
        id: 'sci_veritasium',
        name: 'Veritasium',
        type: 'youtube',
        url: 'https://www.youtube.com/@veritasium',
        originalUrl: 'https://www.youtube.com/@veritasium',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'science_space',
        description: 'Science and engineering explained visually.'
    },
    {
        id: 'sci_kurzgesagt',
        name: 'Kurzgesagt',
        type: 'youtube',
        url: 'https://www.youtube.com/@kurzgesagt',
        originalUrl: 'https://www.youtube.com/@kurzgesagt',
        favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
        category: 'science_space',
        description: 'Animated explainers on science and philosophy.'
    },
    {
        id: 'sci_huberman',
        name: 'Huberman Lab',
        type: 'podcast',
        url: 'https://feeds.megaphone.fm/hubermanlab',
        originalUrl: 'https://hubermanlab.com',
        favicon: 'https://www.google.com/s2/favicons?domain=hubermanlab.com&sz=64',
        category: 'science_space',
        description: 'Neuroscience tools for everyday life.'
    },
    {
        id: 'sci_r_science',
        name: 'r/science',
        type: 'reddit',
        url: 'https://www.reddit.com/r/science/.rss',
        originalUrl: 'https://www.reddit.com/r/science',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'science_space',
        description: 'Peer-reviewed research and scientific discussion.'
    },

    // ═══════════════════════════════════════
    // DESIGN & CREATIVITY
    // ═══════════════════════════════════════
    {
        id: 'design_sidebar',
        name: 'Sidebar',
        type: 'rss',
        url: 'https://sidebar.io/feed.xml',
        originalUrl: 'https://sidebar.io',
        favicon: 'https://www.google.com/s2/favicons?domain=sidebar.io&sz=64',
        category: 'design_creativity',
        description: 'Five best design links, every day.'
    },
    {
        id: 'design_smashing',
        name: 'Smashing Magazine',
        type: 'rss',
        url: 'https://www.smashingmagazine.com/feed',
        originalUrl: 'https://www.smashingmagazine.com',
        favicon: 'https://www.google.com/s2/favicons?domain=smashingmagazine.com&sz=64',
        category: 'design_creativity',
        description: 'For web designers and developers.'
    },
    {
        id: 'design_alistapart',
        name: 'A List Apart',
        type: 'rss',
        url: 'https://alistapart.com/main/feed/',
        originalUrl: 'https://alistapart.com',
        favicon: 'https://www.google.com/s2/favicons?domain=alistapart.com&sz=64',
        category: 'design_creativity',
        description: 'Web standards, best practices, and design thinking.'
    },
    {
        id: 'design_figma',
        name: 'Figma',
        type: 'youtube',
        url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCQsVmhSa4X-G3lHlUtejzLA',
        originalUrl: 'https://www.youtube.com/@Figma',
        favicon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',
        category: 'design_creativity',
        description: 'Design tool tutorials, Config talks, and workflows.'
    },
    {
        id: 'design_thefutur',
        name: 'The Futur',
        type: 'youtube',
        url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-b3c7kxa5vU-bnmaROgvog',
        originalUrl: 'https://www.youtube.com/@thefutur',
        favicon: 'https://www.google.com/s2/favicons?domain=thefutur.com&sz=64',
        category: 'design_creativity',
        description: 'Business of design, branding, and creative strategy.'
    },
    {
        id: 'design_99pi',
        name: '99% Invisible',
        type: 'podcast',
        url: 'https://feeds.simplecast.com/BqbsxVfO',
        originalUrl: 'https://99percentinvisible.org',
        favicon: 'https://www.google.com/s2/favicons?domain=99percentinvisible.org&sz=64',
        category: 'design_creativity',
        description: 'Stories about the design and architecture of everything.'
    },
    {
        id: 'design_r_design',
        name: 'r/design',
        type: 'reddit',
        url: 'https://www.reddit.com/r/design/.rss',
        originalUrl: 'https://www.reddit.com/r/design',
        favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64',
        category: 'design_creativity',
        description: 'Community for designers of all disciplines.'
    },
    {
        id: 'design_brandnew',
        name: 'Brand New',
        type: 'rss',
        url: 'https://www.underconsideration.com/brandnew/feed',
        originalUrl: 'https://www.underconsideration.com/brandnew/',
        favicon: 'https://www.google.com/s2/favicons?domain=underconsideration.com&sz=64',
        category: 'design_creativity',
        description: 'Reviews of corporate and brand identity work.'
    }
];

// --- Helper Functions ---

export function getStarterPacks(): StarterPack[] {
    // Dynamically build packs from the library to ensure data consistency
    const getSourcesByCategory = (cat: SourceCategory) => CURATED_LIBRARY.filter(s => s.category === cat);

    return [
        {
            id: 'pack_tech',
            name: 'Tech & Startups',
            description: 'The pulse of Silicon Valley and the startup ecosystem.',
            icon: 'Zap',
            category: 'tech_startups',
            sources: getSourcesByCategory('tech_startups')
        },
        {
            id: 'pack_finance',
            name: 'Finance & Markets',
            description: 'Global markets, economics, and business intelligence.',
            icon: 'TrendingUp',
            category: 'finance_markets',
            sources: getSourcesByCategory('finance_markets')
        },
        {
            id: 'pack_ai',
            name: 'AI Revolution',
            description: 'Keep up with the exponential curve of AI progress.',
            icon: 'Bot',
            category: 'ai_revolution',
            sources: getSourcesByCategory('ai_revolution')
        },
        {
            id: 'pack_world',
            name: 'World News',
            description: 'Balanced perspectives on global events.',
            icon: 'Globe',
            category: 'world_news',
            sources: getSourcesByCategory('world_news')
        },
        {
            id: 'pack_science',
            name: 'Science & Space',
            description: 'Discoveries from the edge of human knowledge.',
            icon: 'Atom',
            category: 'science_space',
            sources: getSourcesByCategory('science_space')
        },
        {
            id: 'pack_design',
            name: 'Design & Creativity',
            description: 'Inspiration for pixels, products, and user experiences.',
            icon: 'Palette',
            category: 'design_creativity',
            sources: getSourcesByCategory('design_creativity')
        }
    ];
}

export function getContextualRecommendations(existingSourceUrls: string[]): RecommendedSource[] {
    const existingSet = new Set(existingSourceUrls.map(u => u.trim().toLowerCase()));

    // 1. Filter out sources the user already has
    const candidates = CURATED_LIBRARY.filter(s => !existingSet.has(s.url.trim().toLowerCase()) && !existingSet.has(s.originalUrl.trim().toLowerCase()));

    // 2. Category-diverse selection: pick from each category first, then fill remaining
    const byCategory = new Map<string, RecommendedSource[]>();
    for (const c of candidates) {
        const list = byCategory.get(c.category) || [];
        list.push(c);
        byCategory.set(c.category, list);
    }

    const result: RecommendedSource[] = [];
    const TARGET = 6;

    // Round-robin: one from each category
    const categories = [...byCategory.keys()].sort(() => 0.5 - Math.random());
    for (const cat of categories) {
        if (result.length >= TARGET) break;
        const list = byCategory.get(cat)!;
        const pick = list.splice(Math.floor(Math.random() * list.length), 1)[0];
        result.push(pick);
    }

    // Fill remaining slots if needed
    if (result.length < TARGET) {
        const remaining = candidates.filter(c => !result.includes(c));
        const shuffled = remaining.sort(() => 0.5 - Math.random());
        result.push(...shuffled.slice(0, TARGET - result.length));
    }

    return result;
}
