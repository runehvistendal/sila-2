import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function LegalPage() {
  const { pageType } = useParams();
  const { language } = useLanguage();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const results = await base44.entities.LegalContent.filter({ page_type: pageType }, null, 1);
        if (results.length > 0) {
          setContent(results[0]);
        }
      } catch (err) {
        console.error('Error fetching legal content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [pageType]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-muted-foreground">
            {language === 'en' ? 'Content not found.' : language === 'da' ? 'Indhold blev ikke fundet.' : 'Indhold qanurataasunnngittoq.'}
          </p>
        </div>
      </div>
    );
  }

  const title = language === 'da' ? content.title_da || content.title : language === 'kl' ? content.title_kl || content.title : content.title;
  const pageContent = language === 'da' ? content.content_da || content.content : language === 'kl' ? content.content_kl || content.content : content.content;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        {content.last_updated && (
          <p className="text-sm text-muted-foreground mb-8">
            {language === 'en' ? 'Last updated:' : language === 'da' ? 'Sidst opdateret:' : 'Siullaarpaa:'} {format(new Date(content.last_updated), 'dd/MM/yyyy')}
          </p>
        )}
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: pageContent }} />
        </div>
      </div>
    </div>
  );
}