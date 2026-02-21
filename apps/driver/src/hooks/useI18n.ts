import { useDriverStore } from '../store/useDriverStore';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

export const useI18n = () => {
    const language = useDriverStore(state => state.language);
    const translations = language === 'ar' ? ar : en;

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations;

        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }

        return current;
    };

    const isRTL = language === 'ar';

    return { t, isRTL, language };
};
