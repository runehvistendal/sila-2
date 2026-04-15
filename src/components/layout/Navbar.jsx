import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe, Mountain } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const langLabels = { en: 'English', da: 'Dansk', kl: 'Kalaallisut' };

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const links = [
    { to: '/experiences', label: t('nav_experiences') },
    { to: '/cabins', label: t('nav_cabins') },
    { to: '/boats', label: t('nav_boats') },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? 'bg-transparent' : 'bg-card/90 backdrop-blur-xl border-b border-border/50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Mountain className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className={`text-xl font-heading tracking-wide ${isHome ? 'text-white' : 'text-foreground'}`}>
              Sila
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isHome
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } ${location.pathname === link.to ? (isHome ? 'text-white bg-white/10' : 'text-foreground bg-muted') : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={isHome ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}>
                  <Globe className="w-4 h-4 mr-1.5" />
                  {langLabels[lang]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(langLabels).map(([code, label]) => (
                  <DropdownMenuItem key={code} onClick={() => setLang(code)} className={lang === code ? 'bg-muted' : ''}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/list">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5">
                {t('nav_list')}
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden p-2 rounded-lg ${isHome ? 'text-white' : 'text-foreground'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {Object.entries(langLabels).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        lang === code ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/list" onClick={() => setMobileOpen(false)}>
                <Button className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
                  {t('nav_list')}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}