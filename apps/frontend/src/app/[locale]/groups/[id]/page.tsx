'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Group } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Link2, Copy, RefreshCw, Edit, Trash2, LogOut, Loader2, Building2, FileText } from 'lucide-react';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'owner' | 'member';
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGroup();
    fetchMembers();
  }, [params.id]);

  const fetchGroup = async () => {
    try {
      const { data } = await api.get<Group>(`/groups/${params.id}`);
      setGroup(data);
    } catch (error) {
      toast({
        title: t('errors.notFound'),
        variant: 'destructive',
      });
      router.push('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await api.get<GroupMember[]>(`/groups/${params.id}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const copyInviteLink = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/groups/join?token=${group.inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      variant: 'success',
      title: t('groups.linkCopied'),
    });
  };

  const handleRefreshInviteLink = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post<{ inviteToken: string }>(`/groups/${params.id}/refresh-invite`);
      // Update group state with new invite token
      setGroup((prev) => (prev ? { ...prev, inviteToken: data.inviteToken } : prev));
      toast({
        variant: 'success',
        title: t('groups.linkRefreshed'),
      });
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/groups/${params.id}/leave`);
      toast({
        variant: 'success',
        title: t('groups.left'),
      });
      router.push('/groups');
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmText !== group?.name) {
      toast({
        title: t('errors.validation'),
        description: t('groups.deleteWarning', { name: group?.name }),
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/groups/${params.id}`);
      toast({
        variant: 'success',
        title: t('groups.deleted'),
      });
      router.push('/groups');
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleGroupUpdated = () => {
    setShowEditDialog(false);
    fetchGroup();
  };

  if (loading || !group) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === group.ownerId;
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/groups/join?token=${group.inviteToken}`;

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {t('groups.memberCount', { count: group._count.members })}
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {t('groups.listingCount', { count: group._count.sharedListings })}
            </div>
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              {group.community.name}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner ? (
            <>
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setShowLeaveDialog(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('groups.leave')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invite Link Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              {t('groups.inviteLink')}
            </CardTitle>
            <CardDescription>
              Share this link to invite community members to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshInviteLink}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('groups.refreshInviteLink')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Group Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('groups.owner')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="font-medium">
                  {group.owner.firstName} {group.owner.lastName}
                </p>
                {isOwner && <p className="text-sm text-muted-foreground">({t('profile.email')}: You)</p>}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('groups.createdAt')}: {new Date(group.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('groups.community')}: {group.community.name}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {t('groups.members')} ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                    {member.role === 'owner' && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        {t('groups.owner')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.edit')}</DialogTitle>
            <DialogDescription>
              Update your group information
            </DialogDescription>
          </DialogHeader>
          <EditGroupDialog
            group={group}
            onSuccess={handleGroupUpdated}
          />
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.leaveConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.leaveWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('groups.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.deleteWarning', { name: group.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete">
              Type <strong>{group.name}</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={group.name}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={actionLoading || deleteConfirmText !== group.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
