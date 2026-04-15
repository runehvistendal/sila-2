import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

export function useReviewTranslation(reviewText, reviewLanguage = 'da') {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(reviewText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Only translate if global language is English and review is not already in English
    if (language === 'en' && reviewLanguage !== 'en' && reviewText) {
      setIsTranslating(true);
      base44.functions
        .invoke('translateReview', {
          review_id: `${reviewLanguage}_${reviewText.substring(0, 20)}`,
          original_text: reviewText,
          source_language: reviewLanguage,
        })
        .then((response) => {
          setTranslatedText(response.data.translated_text);
        })
        .catch((err) => {
          console.error('Translation error:', err);
          setTranslatedText(reviewText);
        })
        .finally(() => {
          setIsTranslating(false);
        });
    } else {
      setTranslatedText(reviewText);
    }
  }, [language, reviewText, reviewLanguage]);

  return { translatedText, isTranslating };
}