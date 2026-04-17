import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Mail, Shield, BadgeCheck, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [recalculating, setRecalculating] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => base44.asServiceRole.entities.User.list() || [],
  });

  const { data: trustRecords = [] } = useQuery({
    queryKey: ['admin-trust-records'],
    queryFn: () => base44.asServiceRole.entities.ProviderTrust.list(),
  });

  const trustByEmail = Object.fromEntries(trustRecords.map(t => [t.provider_email, t]));

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.asServiceRole.entities.User.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleEditRole = (user) => { setEditingId(user.id); setEditingRole(user.role || 'user'); };
  const handleSaveRole = () => {
    if (editingId) updateUserMutation.mutate({ userId: editingId, data: { role: editingRole } });
  };

  const handleToggleVerified = (user) => {
    updateUserMutation.mutate({ userId: user.id, data: { is_verified: !user.is_verified } });
  };

  const handleRecalculate = async (email) => {
    setRecalculating(email);
    await base44.functions.invoke('calculateTrustScore', { provider_email: email });
    await queryClient.invalidateQueries({ queryKey: ['admin-trust-records'] });
    setRecalculating(null);
  };

  const getTrustBadge = (score) => {
    if (score === undefined || score === null) return <span className="text-xs text-muted-foreground">–</span>;
    const color = score >= 85 ? 'bg-blue-100 text-blue-700' : score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{score}</span>;
  };

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Administrer brugere</h1>

        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)
          ) : users.length === 0 ? (
            <Card><CardContent className="pt-8 text-center text-muted-foreground">Ingen brugere fundet</CardContent></Card>
          ) : (
            users.map((user) => {
              const trust = trustByEmail[user.email];
              return (
                <Card key={user.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{user.full_name || 'Unavngivet'}</h3>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                            <Shield className="w-3 h-3" /> {user.role === 'admin' ? 'Admin' : 'Bruger'}
                          </Badge>
                          {user.is_verified && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                              <BadgeCheck className="w-3 h-3" /> Verificeret
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Oprettet: {new Date(user.created_date).toLocaleDateString('da-DK')}
                        </p>

                        {/* Trust Score row */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Trust Score:</span>
                          {getTrustBadge(trust?.trust_score)}
                          {trust?.trust_score !== undefined && (
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${trust.trust_score >= 85 ? 'bg-blue-500' : trust.trust_score >= 70 ? 'bg-green-500' : trust.trust_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${trust.trust_score}%` }}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleRecalculate(user.email)}
                            disabled={recalculating === user.email}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${recalculating === user.email ? 'animate-spin' : ''}`} />
                            Genberegn
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap items-start">
                        {/* Verified toggle */}
                        <Button
                          size="sm"
                          variant={user.is_verified ? 'default' : 'outline'}
                          onClick={() => handleToggleVerified(user)}
                          disabled={updateUserMutation.isPending}
                          className="gap-1.5 text-xs"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {user.is_verified ? 'Verificeret ✓' : 'Verificer'}
                        </Button>

                        {editingId === user.id ? (
                          <div className="flex gap-2 items-center">
                            <Select value={editingRole} onValueChange={setEditingRole}>
                              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Bruger</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleSaveRole} disabled={updateUserMutation.isPending}>Gem</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Annuller</Button>
                          </div>
                        ) : (
                          <>
                            <Button size="icon" variant="outline" onClick={() => handleEditRole(user)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="outline" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Slet bruger?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.full_name || user.email} vil blive permanent slettet.
                                </AlertDialogDescription>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-destructive" disabled={deleteUserMutation.isPending}>
                                    Slet
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}