import React from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export default function Footer() {
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
              Greenland's marketplace for remote cabins and local boat transport.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Explore</h4>
            <div className="space-y-2.5">
              <Link to="/cabins" className="block text-sm text-white/60 hover:text-white transition-colors">Browse Cabins</Link>
              <Link to="/transport" className="block text-sm text-white/60 hover:text-white transition-colors">Find Transport</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Hosts</h4>
            <div className="space-y-2.5">
              <Link to="/create-listing" className="block text-sm text-white/60 hover:text-white transition-colors">List your cabin</Link>
              <Link to="/create-listing?type=transport" className="block text-sm text-white/60 hover:text-white transition-colors">Offer transport</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-white/30 text-center">
          © 2026 Sila · Greenland 🇬🇱
        </div>
      </div>
    </footer>
  );
}