import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function AdminSupport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [responses, setResponses] = useState({});

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () =>
      base44.entities.Support.filter({ escalated: true, status: 'escalated' }, '-created_date', 100),
  });

  const respondMutation = useMutation({
    mutationFn: ({ ticketId, response }) =>
      base44.entities.Support.update(ticketId, {
        admin_response: response,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries(['support-tickets']);
      toast({ title: 'Response sent' });
    },
  });

  const handleRespond = (ticketId) => {
    const response = responses[ticketId];
    if (!response) {
      toast({ title: 'Please enter a response' });
      return;
    }
    respondMutation.mutate({ ticketId, response });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Escalated Support Tickets</h1>
        <p className="text-muted-foreground mb-8">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} waiting for response
        </p>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">All support tickets are resolved!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{ticket.subject}</div>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.customer_email}</p>
                      <p className="text-xs text-muted-foreground mt-2">{ticket.message}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Escalated
                    </Badge>
                  </div>
                </button>

                {expandedId === ticket.id && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        AI Assessment
                      </p>
                      <p className="text-sm text-foreground bg-white p-3 rounded-lg">{ticket.ai_response}</p>
                    </div>

                    {ticket.escalation_reason && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          Escalation Reason
                        </p>
                        <p className="text-sm text-foreground">{ticket.escalation_reason}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Your Response
                      </p>
                      <Textarea
                        placeholder="Write your response to the customer..."
                        value={responses[ticket.id] || ''}
                        onChange={(e) =>
                          setResponses({ ...responses, [ticket.id]: e.target.value })
                        }
                        className="resize-none h-24 rounded-lg"
                      />
                    </div>

                    <Button
                      onClick={() => handleRespond(ticket.id)}
                      disabled={respondMutation.isPending}
                      className="w-full bg-primary text-white gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Response & Close
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}