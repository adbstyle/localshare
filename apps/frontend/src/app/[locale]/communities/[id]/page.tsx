'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Community, Group } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Link2,
  Edit,
  Trash2,
  LogOut,
  Loader2,
  FileText,
  Plus,
  MoreVertical,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { EditCommunityDialog } from '@/components/communities/edit-community-dialog';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { JoinGroupDialog } from '@/components/groups/join-group-dialog';

interface CommunityMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'owner' | 'member';
}

const INITIAL_MEMBERS_SHOWN = 10;

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showJoinGroupDialog, setShowJoinGroupDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchMembers();
    fetchGroups();
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

  const fetchGroups = async () => {
    try {
      const { data } = await api.get<Group[]>(`/groups?communityId=${params.id}`);
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
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

  const handleGroupCreated = () => {
    setShowCreateGroupDialog(false);
    fetchGroups();
  };

  const handleJoinGroupSuccess = () => {
    setShowJoinGroupDialog(false);
    fetchGroups();
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
  const displayedMembers = showAllMembers ? members : members.slice(0, INITIAL_MEMBERS_SHOWN);

  return (
    <div className="container max-w-4xl py-8">
      {/* Header Section */}
      <div className="mb-6">
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

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b">
        <Button variant="outline" size="sm" onClick={copyInviteLink}>
          <Link2 className="h-4 w-4 mr-2" />
          {t('communities.invite')}
        </Button>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowCreateGroupDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('groups.create')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowJoinGroupDialog(true)}>
              <Link2 className="h-4 w-4 mr-2" />
              {t('groups.joinViaLink')}
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={handleRefreshInviteLink} disabled={actionLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('communities.refreshInviteLink')}
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem
                onClick={() => setShowLeaveDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('communities.leave')}
              </DropdownMenuItem>
            )}
            {isOwner && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Groups Accordion */}
      <Collapsible open={groupsOpen} onOpenChange={setGroupsOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
          {groupsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('groups.myGroups')} ({groups.length})
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {t('groups.empty')}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 py-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => router.push(`/groups/${group.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/groups/${group.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${group.name} - ${t('groups.memberCount', { count: group._count?.members || 0 })}`}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('groups.memberCount', { count: group._count?.members || 0 })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Members Accordion */}
      <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
          {membersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('communities.members')} ({members.length})
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 py-4">
            {displayedMembers.map((member) => (
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
                  {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {members.length > INITIAL_MEMBERS_SHOWN && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="w-full"
            >
              {showAllMembers
                ? t('common.showLess')
                : t('common.showAll', { count: members.length })}
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('communities.edit')}</DialogTitle>
            <DialogDescription>
              {t('communities.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <EditCommunityDialog
            community={community}
            onSuccess={handleCommunityUpdated}
          />
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.create')}</DialogTitle>
            <DialogDescription>
              {t('groups.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <CreateGroupDialog
            onSuccess={handleGroupCreated}
            preselectedCommunityId={community.id}
          />
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <JoinGroupDialog
        open={showJoinGroupDialog}
        onOpenChange={setShowJoinGroupDialog}
        hideDefaultTrigger
        onJoinSuccess={handleJoinGroupSuccess}
      />

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
              {t('common.typeToConfirm', { name: community.name })}
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
