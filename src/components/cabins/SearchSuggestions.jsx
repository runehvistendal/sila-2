import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function SearchSuggestions({ value, onSelect, cabins = [] }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const suggestionsRef = useRef(null);

  const { data: allCabins } = useQuery({
    queryKey: ['cabins-for-autocomplete'],
    queryFn: () => base44.entities.Cabin.filter({ status: 'active' }, '-created_date', 100),
    initialData: cabins,
  });

  const generateSuggestions = useCallback(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const q = value.toLowerCase();
    const uniqueSuggestions = new Set();

    (allCabins || []).forEach((cabin) => {
      if (cabin.title?.toLowerCase().includes(q)) uniqueSuggestions.add(cabin.title);
      if (cabin.location?.toLowerCase().includes(q)) uniqueSuggestions.add(cabin.location);
      (cabin.amenities || []).forEach((a) => {
        if (a.toLowerCase().includes(q)) uniqueSuggestions.add(a);
      });
    });

    setSuggestions(Array.from(uniqueSuggestions).sort());
    setOpen(uniqueSuggestions.size > 0);
  }, [value, allCabins]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open || suggestions.length === 0) return null;

  return (
    <div
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-card z-50 max-h-64 overflow-y-auto"
    >
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => {
            onSelect(suggestion);
            setOpen(false);
          }}
          className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm text-foreground border-b border-border last:border-b-0"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}