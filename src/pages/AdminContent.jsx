import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Eye } from 'lucide-react';

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    page_type: '',
    title: '',
    content: '',
    status: 'draft',
  });

  const { data: contents = [] } = useQuery({
    queryKey: ['admin-content'],
    queryFn: async () => {
      const res = await base44.entities.Content.list();
      return res || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Content.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setFormData({ page_type: '', title: '', content: '', status: 'draft' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Content.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Content.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (content) => {
    setEditing(content);
    setFormData(content);
  };

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Administrer indhold</h1>
          {!editing && (
            <Button onClick={() => setFormData({ page_type: '', title: '', content: '', status: 'draft' })} className="gap-2">
              <Plus className="w-4 h-4" /> Nyt indhold
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>{editing ? 'Rediger indhold' : 'Opret nyt indhold'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Type</label>
                  <Select value={formData.page_type} onValueChange={(val) => setFormData({ ...formData, page_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_hero">Hjem — Hero</SelectItem>
                      <SelectItem value="home_how_it_works">Hjem — Sådan virker det</SelectItem>
                      <SelectItem value="cabins_intro">Hytter — Intro</SelectItem>
                      <SelectItem value="transport_intro">Transport — Intro</SelectItem>
                      <SelectItem value="article">Artikel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Titel</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titel"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Indhold</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Indhold (HTML eller markdown)"
                    className="min-h-32"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Status</label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Udkast</SelectItem>
                      <SelectItem value="published">Offentliggjort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editing ? 'Gem ændringer' : 'Opret'}
                  </Button>
                  {editing && (
                    <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">
                      Annuller
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Indhold liste */}
          <div className="lg:col-span-2 space-y-3">
            {contents.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground">
                  Intet indhold oprettet endnu
                </CardContent>
              </Card>
            ) : (
              contents.map((content) => (
                <Card key={content.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{content.title}</h3>
                          <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                            {content.status === 'published' ? '🟢 Live' : '🔲 Udkast'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{content.page_type}</p>
                        <p className="text-sm text-foreground line-clamp-2">{content.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="icon" variant="outline" onClick={() => handleEdit(content)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="outline" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Slet indhold?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Dette kan ikke fortrydes. "{content.title}" vil blive permanent slettet.
                            </AlertDialogDescription>
                            <div className="flex justify-end gap-2">
                              <AlertDialogCancel>Annuller</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(content.id)} className="bg-destructive">
                                Slet
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}