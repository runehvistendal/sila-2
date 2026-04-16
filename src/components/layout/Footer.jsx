import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Waves } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                <Waves className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Sila</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('footer_desc')}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{t('footer_explore')}</h4>
            <div className="space-y-2.5">
              <Link to="/cabins" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_browse_cabins')}</Link>
              <Link to="/transport" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_find_transport')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{t('footer_hosts')}</h4>
            <div className="space-y-2.5">
              <Link to="/create-listing" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_list_cabin')}</Link>
              <Link to="/create-listing?type=transport" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_offer_transport')}</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{t('footer_learn')}</h4>
              <div className="space-y-2.5">
                <Link to="/trust-score" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_trust_score')}</Link>
                <Link to="/verified-safety" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_verified_safety')}</Link>
                <Link to="/community-guidelines" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_community_guidelines')}</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{t('footer_legal')}</h4>
              <div className="space-y-2.5">
                <Link to="/legal/privacy_policy" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_privacy_policy')}</Link>
                <Link to="/legal/terms_of_service" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_terms')}</Link>
                <Link to="/legal/cookies_consent" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_cookies')}</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">{t('footer_support')}</h4>
              <div className="space-y-2.5">
                <Link to="/privacy-center" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_privacy_center')}</Link>
                <Link to="/support" className="block text-sm text-white/60 hover:text-white transition-colors">{t('footer_contact_support')}</Link>
              </div>
            </div>
          </div>
          <div className="text-xs text-white/30 text-center pt-6 border-t border-white/10">
            © 2026 Sila · Greenland 🇬🇱
          </div>
        </div>
      </div>
    </footer>
  );
}