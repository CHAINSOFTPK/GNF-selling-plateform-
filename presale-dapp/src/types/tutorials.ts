export interface NavigationText {
    videos: string;
    docs: string;
    guide: string;
    dashboard: string;
    buy: string;
    noVideos: string;
}

export interface VideoTutorial {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeUrl: string;
    duration: string;
    language?: string; // Made optional to match the JSON structure
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface DocumentationItem {
    title: string;
    type: 'guide' | 'faq';
    content: string[] | FAQ[];
}

export interface TutorialData {
    navigation: {
        [key in 'en' | 'uz' | 'tr' | 'ru']: NavigationText;
    };
    videos: {
        [key in 'en' | 'uz' | 'tr' | 'ru']: VideoTutorial[];
    };
    documentation: {
        [key in 'en' | 'uz' | 'tr' | 'ru']: DocumentationItem[];
    };
}
