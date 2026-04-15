import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Mountain } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <Mountain className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-heading">Sila</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-md">
              {t('footer_desc')}
            </p>
            <p className="mt-6 text-xs text-primary-foreground/40">
              "Sila" — weather, consciousness, the outside world — a concept shared across Inuit languages.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider text-primary-foreground/50 mb-4">Explore</h4>
            <div className="space-y-3">
              <Link to="/experiences" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t('nav_experiences')}</Link>
              <Link to="/cabins" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t('nav_cabins')}</Link>
              <Link to="/boats" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t('nav_boats')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider text-primary-foreground/50 mb-4">Company</h4>
            <div className="space-y-3">
              <Link to="/about" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t('nav_about')}</Link>
              <Link to="/list" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t('nav_list')}</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Sila. {t('footer_tagline')}
          </p>
          <div className="flex items-center gap-4 text-xs text-primary-foreground/40">
            <span>Nuuk</span>
            <span>•</span>
            <span>Ilulissat</span>
            <span>•</span>
            <span>Greenland 🇬🇱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}