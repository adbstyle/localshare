'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Group } from '@localshare/shared';
import { Button } from '@/components/ui/button';
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
import { Users, Link2, RefreshCw, Edit, Trash2, LogOut, Loader2, FileText, MoreVertical, ChevronDown, ChevronRight, X } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'owner' | 'member';
}

const INITIAL_MEMBERS_SHOWN = 10;

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
  const [membersOpen, setMembersOpen] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);

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
      router.push('/communities');
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
      router.push(`/communities/${group?.community?.id || ''}`);
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
      router.push(`/communities/${group?.community?.id || ''}`);
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

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    try {
      await api.delete(`/groups/${params.id}/members/${memberToRemove.id}`);
      toast({
        variant: 'success',
        title: t('groups.memberRemoved'),
      });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowRemoveMemberDialog(false);
      setMemberToRemove(null);
    }
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
  const displayedMembers = showAllMembers ? members : members.slice(0, INITIAL_MEMBERS_SHOWN);

  return (
    <div className="container max-w-4xl py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/communities">
              {t('nav.communities')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/communities/${group.community.id}`}>
              {group.community.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{group.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="mb-6">
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
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b">
        <Button variant="outline" onClick={copyInviteLink}>
          <Link2 className="h-4 w-4 mr-2" />
          {t('groups.invite')}
        </Button>
        {isOwner && (
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem onClick={handleRefreshInviteLink} disabled={actionLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('groups.refreshInviteLink')}
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem
                onClick={() => setShowLeaveDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('groups.leave')}
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

      {/* Members Collapsible */}
      <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
          {membersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('groups.members')} ({members.length})
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 py-4">
            {displayedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border group"
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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                  {isOwner && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setMemberToRemove(member);
                        setShowRemoveMemberDialog(true);
                      }}
                      aria-label={`${t('groups.removeMember')} ${member.firstName} ${member.lastName}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
            <DialogTitle>{t('groups.edit')}</DialogTitle>
            <DialogDescription>
              {t('groups.editDescription')}
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
              {t('common.typeToConfirm', { name: group.name })}
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

      {/* Remove Member Dialog */}
      <AlertDialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.removeMemberConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.removeMemberWarning', {
                name: `${memberToRemove?.firstName} ${memberToRemove?.lastName}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('groups.removeMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
