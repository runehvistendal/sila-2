import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, AlertCircle, CheckCircle, Clock, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function GrowthInsights() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedRec, setExpandedRec] = useState(null);

  // Fetch latest growth report
  const { data: report, isLoading } = useQuery({
    queryKey: ['growth-report'],
    queryFn: () =>
      base44.entities.Growth.list('-created_date', 1).then((r) => r[0]),
  });

  // Mutation for approving recommendations
  const approveMutation = useMutation({
    mutationFn: ({ reportId, recId, status }) =>
      base44.entities.Growth.update(reportId, {
        recommendations: report.recommendations.map((r) =>
          r.id === recId ? { ...r, status } : r
        ),
      }),
    onSuccess: () => {
      qc.invalidateQueries(['growth-report']);
      toast({ title: 'Recommendation updated' });
    },
  });

  const handleRecommendation = (recId, status) => {
    if (report?.id) {
      approveMutation.mutate({ reportId: report.id, recId, status });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen pt-16 bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">No growth analysis yet</p>
          <Button
            onClick={() => base44.functions.invoke('generateGrowthInsights', {})}
            className="bg-primary text-white"
          >
            Generate First Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Growth & Insights</h1>
              <p className="text-sm text-muted-foreground">
                Report for {report.period_start} to {report.period_end}
              </p>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Requests', value: report.kpi_summary.total_requests },
            { label: 'Bookings', value: report.kpi_summary.total_bookings },
            { label: 'Conversion', value: `${report.kpi_summary.conversion_rate}%` },
            { label: 'Avg Value', value: `${report.kpi_summary.avg_booking_value_dkk} DKK` },
            { label: 'Active Users', value: report.kpi_summary.active_users },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border border-border p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Top Locations */}
        {report.kpi_summary.top_locations?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Top Locations</h2>
            <div className="space-y-3">
              {report.kpi_summary.top_locations.map((loc) => (
                <div key={loc.location} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium text-foreground">{loc.location}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">{loc.requests} requests</span>
                    <span className="text-primary font-semibold">{loc.bookings} booked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {report.highlights?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              What's Working Well
            </h2>
            <div className="space-y-3">
              {report.highlights.map((h, i) => (
                <div key={i} className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {h.title}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{h.description}</p>
                  {h.metric && <p className="text-xs text-accent font-medium mt-2">Metric: {h.metric}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Problems */}
        {report.problems?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Friction Points
            </h2>
            <div className="space-y-3">
              {report.problems.map((p, i) => (
                <div
                  key={i}
                  className={`p-4 border rounded-lg ${
                    p.impact === 'high'
                      ? 'bg-destructive/10 border-destructive/30'
                      : p.impact === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      {p.impact}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{p.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      {p.funnel_stage && (
                        <p className="text-xs text-muted-foreground mt-2">Stage: {p.funnel_stage}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
              <Zap className="w-5 h-5 text-primary" />
              Actionable Recommendations
            </h2>
            <div className="space-y-3">
              {report.recommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    rec.status === 'approved'
                      ? 'bg-accent/10 border-accent/30'
                      : rec.status === 'declined'
                      ? 'bg-muted border-border'
                      : 'bg-white border-border'
                  }`}
                >
                  <button
                    onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{rec.title}</span>
                        <Badge
                          variant="outline"
                          className={`${
                            rec.priority === 'high'
                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.action_type}
                        </Badge>
                        {rec.status !== 'pending' && (
                          <Badge
                            variant="outline"
                            className={`${
                              rec.status === 'approved'
                                ? 'bg-accent/20 text-accent border-accent/50'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {rec.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </button>

                  {expandedRec === rec.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border px-4 py-4 bg-muted/50 space-y-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Expected Impact</p>
                        <p className="text-sm text-foreground">{rec.expected_impact}</p>
                      </div>

                      {rec.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            className="flex-1 bg-accent text-white hover:bg-accent/90"
                            onClick={() => handleRecommendation(rec.id, 'approved')}
                            disabled={approveMutation.isPending}
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRecommendation(rec.id, 'declined')}
                            disabled={approveMutation.isPending}
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}

                      {rec.admin_notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Admin Notes</p>
                          <p className="text-sm text-foreground">{rec.admin_notes}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}