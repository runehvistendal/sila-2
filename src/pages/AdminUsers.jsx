import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Mail, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await base44.asServiceRole.entities.User.list();
      return res || [];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.asServiceRole.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleEditRole = (user) => {
    setEditingId(user.id);
    setEditingRole(user.role || 'user');
  };

  const handleSaveRole = () => {
    if (editingId) {
      updateUserMutation.mutate({
        userId: editingId,
        data: { role: editingRole },
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Administrer brugere</h1>

        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center text-muted-foreground">
                Ingen brugere fundet
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{user.full_name || 'Unavngivet'}</h3>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                          <Shield className="w-3 h-3" /> {user.role === 'admin' ? 'Admin' : 'Bruger'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Oprettet: {new Date(user.created_date).toLocaleDateString('da-DK')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {editingId === user.id ? (
                        <div className="flex gap-2 items-center">
                          <Select value={editingRole} onValueChange={setEditingRole}>
                            <SelectTrigger className="w-32 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Bruger</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleSaveRole} disabled={updateUserMutation.isPending}>
                            Gem
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Annuller
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditRole(user)}
                            className="gap-1"
                          >
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
                                {user.full_name || user.email} vil blive permanent slettet. Dette kan ikke fortrydes.
                              </AlertDialogDescription>
                              <div className="flex justify-end gap-2">
                                <AlertDialogCancel>Annuller</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-destructive"
                                  disabled={deleteUserMutation.isPending}
                                >
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}