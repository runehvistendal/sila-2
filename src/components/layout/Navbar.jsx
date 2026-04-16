import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LayoutDashboard, LogOut, Plus, Waves, UserCircle, Heart, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import CurrencySelector from '@/components/shared/CurrencySelector';

export default function Navbar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = isHome && !scrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-border shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo — desktop only, mobile has hamburger */}
          <Link to="/" className="hidden md:flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-xl items-center justify-center flex">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${transparent ? 'text-white' : 'text-foreground'}`}>
              Sila
            </span>
          </Link>

          {/* Mobile/tablet menu button as logo */}
          <button
            className="md:hidden w-8 h-8 bg-primary rounded-xl items-center justify-center flex"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Waves className="w-4 h-4 text-white" />
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/cabins', label: 'nav_cabins' },
              { to: '/transport', label: 'nav_boats' },
              { to: '/request-transport', label: 'nav_request_transport' },
              { to: '/request-cabin', label: 'nav_request_cabin' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  transparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } ${location.pathname === link.to ? (transparent ? 'text-white bg-white/10' : 'text-foreground bg-muted') : ''}`}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Mobile language switcher */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher transparent={transparent} mobileCompact={true} />
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <CurrencySelector />
            <LanguageSwitcher transparent={transparent} />
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      transparent ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-muted hover:bg-secondary text-foreground'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/create-listing?type=cabin" className="flex items-center gap-2 cursor-pointer">
                        <Home className="w-4 h-4" /> Opret hytte
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-listing?type=transport" className="flex items-center gap-2 cursor-pointer">
                        <Waves className="w-4 h-4" /> Opret transport
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className={transparent ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}>
                    {t('nav_dashboard')}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors overflow-hidden ${
                      transparent ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-muted hover:bg-secondary text-foreground'
                    }`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 text-sm font-medium text-foreground truncate">{user.full_name || user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                       <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                         <LayoutDashboard className="w-4 h-4" /> {t('nav_dashboard')}
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                         <UserCircle className="w-4 h-4" /> {t('nav_profile')}
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link to="/favourites" className="flex items-center gap-2 cursor-pointer">
                         <Heart className="w-4 h-4" /> {t('nav_favourites')}
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link to="/create-listing" className="flex items-center gap-2 cursor-pointer">
                         <PlusCircle className="w-4 h-4" /> {t('nav_create_listing')}
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-destructive flex items-center gap-2 cursor-pointer">
                       <LogOut className="w-4 h-4" /> {t('nav_sign_out')}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => base44.auth.redirectToLogin()} className={transparent ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}>
                  {t('nav_sign_in')}
                </Button>
                <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="bg-primary text-white hover:bg-primary/90 rounded-full px-5">
                  {t('nav_get_started')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu close button */}
          {mobileOpen && (
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${transparent ? 'text-white' : 'text-foreground'}`}
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <Link to="/cabins" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_cabins')}</Link>
              <Link to="/transport" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_boats')}</Link>
              <Link to="/request-transport" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_request_transport')}</Link>
              <Link to="/request-cabin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_request_cabin')}</Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_dashboard')}</Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_profile')}</Link>
                  <Link to="/favourites" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted font-medium">{t('nav_favourites')}</Link>
    
                  <button onClick={() => base44.auth.logout()} className="w-full text-left px-4 py-3 rounded-lg text-destructive hover:bg-muted font-medium">{t('nav_sign_out')}</button>
                </>
              ) : (
                <div className="pt-2">
                  <Button className="w-full bg-primary text-white" onClick={() => base44.auth.redirectToLogin()}>{t('nav_sign_in')} / {t('nav_get_started')}</Button>
                </div>
              )}
              <div className="pt-4 border-t border-border">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}