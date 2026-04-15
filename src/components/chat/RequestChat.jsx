import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Package, User } from 'lucide-react';
import { format } from 'date-fns';

export default function RequestChat({ requestId, requestType, participants, onOfferAccepted }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offer, setOffer] = useState({ price_dkk: '', seats: '', note: '' });
  const bottomRef = useRef(null);

  // Check if current user is a participant
  const isParticipant = participants?.includes(user?.email);

  const loadMessages = async () => {
    if (!requestId) return;
    const msgs = await base44.entities.Message.filter(
      { request_id: requestId, request_type: requestType },
      'created_date',
      100
    );
    setMessages(msgs);
  };

  useEffect(() => {
    loadMessages();
    // Real-time subscription
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.request_id === requestId) {
        loadMessages();
      }
    });
    return unsub;
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isParticipant) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Kun deltagere i denne forespørgsel har adgang til chatten.
      </div>
    );
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await base44.entities.Message.create({
      request_id: requestId,
      request_type: requestType,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: text.trim(),
      message_type: 'text',
    });
    setText('');
    setSending(false);
  };

  const sendOffer = async () => {
    if (!offer.price_dkk || sending) return;
    setSending(true);
    await base44.entities.Message.create({
      request_id: requestId,
      request_type: requestType,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: `Tilbud: ${offer.price_dkk} DKK${offer.seats ? ` · ${offer.seats} pladser` : ''}`,
      message_type: 'offer',
      offer_data: { price_dkk: Number(offer.price_dkk), seats: Number(offer.seats), note: offer.note },
    });
    setOffer({ price_dkk: '', seats: '', note: '' });
    setShowOfferForm(false);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px] max-h-[480px] bg-white rounded-2xl border border-border overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">Ingen beskeder endnu. Start samtalen.</p>
        )}
        {messages.map((msg) => {
           const isMe = msg.sender_email === user.email;
           return (
             <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
               {!isMe && (
                 <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                   {msg.sender_avatar ? (
                     <img src={msg.sender_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                   ) : (
                     <User className="w-3 h-3" />
                   )}
                 </div>
               )}
               <div className={isMe ? 'flex gap-2' : ''}>
                 {msg.message_type === 'offer' ? (
                   <OfferCard msg={msg} isMe={isMe} onAccept={onOfferAccepted} userEmail={user.email} />
                 ) : (
                   <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                     {!isMe && <p className="text-xs font-semibold mb-1 opacity-60">{msg.sender_name}</p>}
                     <p>{msg.content}</p>
                     <p className={`text-xs mt-1 ${isMe ? 'text-white/50' : 'text-muted-foreground'}`}>
                       {format(new Date(msg.created_date), 'HH:mm')}
                     </p>
                   </div>
                 )}
               </div>
             </div>
           );
         })}
        <div ref={bottomRef} />
      </div>

      {/* Offer form */}
      {showOfferForm && (
        <div className="border-t border-border bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Send tilbud</p>
          <div className="flex gap-2">
            <Input placeholder="Pris (DKK)" type="number" value={offer.price_dkk} onChange={e => setOffer(o => ({ ...o, price_dkk: e.target.value }))} className="h-8 text-sm" />
            <Input placeholder="Pladser" type="number" value={offer.seats} onChange={e => setOffer(o => ({ ...o, seats: e.target.value }))} className="h-8 text-sm w-24" />
          </div>
          <Input placeholder="Note (valgfri)" value={offer.note} onChange={e => setOffer(o => ({ ...o, note: e.target.value }))} className="h-8 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={sendOffer} disabled={sending} className="bg-primary text-white rounded-lg h-8 text-xs">Send tilbud</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowOfferForm(false)} className="h-8 text-xs">Annuller</Button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-primary"
          onClick={() => setShowOfferForm(!showOfferForm)}
          title="Send tilbud"
        >
          <Package className="w-4 h-4" />
        </Button>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Skriv en besked..."
          className="flex-1 h-9 text-sm"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} className="shrink-0 h-9 w-9 bg-primary text-white">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function OfferCard({ msg, isMe, onAccept, userEmail }) {
  const od = msg.offer_data || {};
  return (
    <div className="max-w-[80%] bg-white border border-primary/20 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Tilbud fra {msg.sender_name}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge className="bg-primary/10 text-primary border-0 text-sm font-bold">{od.price_dkk} DKK</Badge>
        {od.seats && <Badge className="bg-muted text-foreground border-0 text-xs">{od.seats} pladser</Badge>}
      </div>
      {od.note && <p className="text-xs text-muted-foreground mb-3 italic">{od.note}</p>}
      <p className="text-xs text-muted-foreground">{format(new Date(msg.created_date), 'HH:mm')}</p>
      {!isMe && onAccept && (
        <Button size="sm" onClick={() => onAccept(od)} className="mt-3 w-full bg-primary text-white rounded-xl text-xs h-8">
          Accepter tilbud
        </Button>
      )}
    </div>
  );
}