'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Community } from '@localshare/shared';
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
import { Users, Link2, Copy, RefreshCw, Edit, Trash2, LogOut, Loader2, FileText } from 'lucide-react';
import { EditCommunityDialog } from '@/components/communities/edit-community-dialog';

interface CommunityMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'owner' | 'member';
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchMembers();
  }, [params.id]);

  const fetchCommunity = async () => {
    try {
      const { data } = await api.get<Community>(`/communities/${params.id}`);
      setCommunity(data);
    } catch (error) {
      toast({
        title: t('errors.notFound'),
        variant: 'destructive',
      });
      router.push('/communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await api.get<CommunityMember[]>(`/communities/${params.id}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const copyInviteLink = () => {
    if (!community) return;
    const inviteUrl = `${window.location.origin}/communities/join?token=${community.inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      variant: 'success',
      title: t('communities.linkCopied'),
    });
  };

  const handleRefreshInviteLink = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post<{ inviteToken: string }>(`/communities/${params.id}/refresh-invite`);
      // Update community state with new invite token
      setCommunity((prev) => (prev ? { ...prev, inviteToken: data.inviteToken } : prev));
      toast({
        variant: 'success',
        title: t('communities.linkRefreshed'),
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

  const handleLeaveCommunity = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/communities/${params.id}/leave`);
      toast({
        variant: 'success',
        title: t('communities.left'),
      });
      router.push('/communities');
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

  const handleDeleteCommunity = async () => {
    if (deleteConfirmText !== community?.name) {
      toast({
        title: t('errors.validation'),
        description: t('communities.deleteWarning', { name: community?.name }),
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/communities/${params.id}`);
      toast({
        variant: 'success',
        title: t('communities.deleted'),
      });
      router.push('/communities');
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

  const handleCommunityUpdated = () => {
    setShowEditDialog(false);
    fetchCommunity();
  };

  if (loading || !community) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === community.ownerId;
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/communities/join?token=${community.inviteToken}`;

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
          {community.description && (
            <p className="text-muted-foreground">{community.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {t('communities.memberCount', { count: community._count.members })}
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {t('communities.listingCount', { count: community._count.sharedListings })}
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
              {t('communities.leave')}
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
              {t('communities.inviteLink')}
            </CardTitle>
            <CardDescription>
              Share this link to invite others to join
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
                {t('communities.refreshInviteLink')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Community Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('communities.owner')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="font-medium">
                  {community.owner.firstName} {community.owner.lastName}
                </p>
                {isOwner && <p className="text-sm text-muted-foreground">({t('profile.email')}: You)</p>}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('communities.createdAt')}: {new Date(community.createdAt).toLocaleDateString()}
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
            {t('communities.members')} ({members.length})
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
                        {t('communities.owner')}
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
            <DialogTitle>{t('communities.edit')}</DialogTitle>
            <DialogDescription>
              Update your community information
            </DialogDescription>
          </DialogHeader>
          <EditCommunityDialog
            community={community}
            onSuccess={handleCommunityUpdated}
          />
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('communities.leaveConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('communities.leaveWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveCommunity}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('communities.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('communities.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('communities.deleteWarning', { name: community.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete">
              Type <strong>{community.name}</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={community.name}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommunity}
              disabled={actionLoading || deleteConfirmText !== community.name}
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
