import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, X, Loader, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hej! Jeg er Sila\'s AI-assistent. Jeg kan besvare spørgsmål om hytter, transport og bookinger. Spørg mig gerne – og jeg er ærlig omkring hvad jeg kan.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er en hjælpsom chatbot for Sila – en grønlandsk hytte- og transportmarkedsplads. 
        
Besvar brugeres spørgsmål kort og venligt. Du er en bot og kan være ærlig omkring det.

Hvis brugeren beder om noget der kræver menneskelig hjælp (f.eks. booking-problemer, refusioner, eller ernstige klager), foreslå dem at kontakte customer support på /support.

Sila handler om:
- Fjernliggende hytter i Grønland
- Båd-transport mellem byer
- Booking af både hytter og transport sammen
- Trust score for værter og transportaktører
- Sikkerheds- og samskabelsesretningslinjer

Brugeres spørgsmål: "${userMessage}"`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { role: 'bot', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Beklager, jeg havde svært ved at besvare det. Kan du prøve igen eller kontakte support?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-border z-40 flex flex-col max-h-[600px]"
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 rounded-t-2xl">
              <h3 className="font-semibold text-sm">Sila AI Assistant</h3>
              <p className="text-xs text-white/70 mt-0.5">Jeg er en bot – men jeg hjælper gerne!</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Spørg mig..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
                className="h-9 rounded-lg text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="h-9 w-9 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Support CTA */}
            <div className="border-t border-border p-3 bg-muted/50">
              <a
                href="/support"
                className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
              >
                <span>Behøver du menneskelig hjælp?</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}