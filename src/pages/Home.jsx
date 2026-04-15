import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CabinCard from '@/components/cabins/CabinCard';
import GreenlandMap from '@/components/shared/GreenlandMap';
import { Search, ArrowRight, Anchor, Home as HomeIcon, Users, Map } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: featuredCabins = [] } = useQuery({
    queryKey: ['featured-cabins'],
    queryFn: async () => {
      try {
        return await base44.entities.Cabin.filter({ status: 'active' }, '-created_date', 6);
      } catch (error) {
        console.error('Error fetching featured cabins:', error);
        return [];
      }
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/cabins${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-r from-primary/80 to-accent/80">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop&q=85"
            alt="Greenland"
            className="w-full h-full object-cover opacity-70"
            onError={(e) => e.target.style.display = 'none'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-white/90 text-xs font-medium">Greenland's cabin & boat marketplace</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-5">
              Escape to the<br />real Greenland
            </h1>

            <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10">
              Remote cabins. Local boat transport. <br className="hidden sm:block" />Book them together, seamlessly.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 bg-white/95 backdrop-blur-sm rounded-xl border-0 shadow-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-primary hover:bg-primary/90 rounded-xl font-semibold shadow-lg">
                Search
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">How Sila works</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">Book your cabin and transport in one place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: '01',
                title: 'Find your cabin',
                desc: 'Browse remote cabins across Greenland, filtered by location and price.',
              },
              {
                icon: Anchor,
                step: '02',
                title: 'Book transport',
                desc: "See transport options directly on the cabin page. Some hosts provide it themselves.",
              },
              {
                icon: HomeIcon,
                step: '03',
                title: 'Experience it',
                desc: 'Your host confirms the booking and you head off into the Arctic wilderness.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary/50 tracking-widest uppercase">Step {item.step}</span>
                <h3 className="text-lg font-bold text-foreground mt-1 mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CABINS */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Featured cabins</h2>
              <p className="text-muted-foreground">Handpicked remote stays in Greenland</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/cabins')} className="text-primary hover:text-primary/80 hidden sm:flex gap-1 group font-semibold">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {featuredCabins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCabins.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border">
              <HomeIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium mb-2">No cabins listed yet</p>
              <Button size="sm" onClick={() => navigate('/create-listing')} className="mt-2 bg-primary text-white">Be the first host</Button>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" onClick={() => navigate('/cabins')} className="rounded-xl px-6">View all cabins</Button>
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Map className="w-7 h-7 text-primary" /> Udforsk på kort
              </h2>
              <p className="text-muted-foreground">Se alle hytter geografisk placeret i Grønland</p>
            </div>
          </div>
          <GreenlandMap cabins={featuredCabins} height="450px" />
        </div>
      </section>

      {/* HOST CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Own a cabin or boat in Greenland?
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                List it on Sila and connect with travelers from around the world. 
                Simple, free to start, and you keep control.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-semibold"
                  onClick={() => window.location.href = '/create-listing'}
                >
                  List your cabin
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-8"
                  onClick={() => window.location.href = '/create-listing?type=transport'}
                >
                  Offer transport
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: HomeIcon, label: 'Cabins listed', value: 'Free to list' },
                { icon: Anchor, label: 'Transport routes', value: 'You set the price' },
                { icon: Users, label: 'Travelers', value: 'Direct booking' },
                { icon: Search, label: 'Visibility', value: 'Arctic-focused' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <item.icon className="w-6 h-6 text-white/60 mb-3" />
                  <p className="text-white font-bold text-base">{item.value}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}