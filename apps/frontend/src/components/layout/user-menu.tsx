'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { User as UserIcon, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface UserMenuProps {
  user: User;
  logout: () => void;
}

function getUserInitials(user: User): string {
  // Try to get initials from first and last name
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  // Fallback to first name initial if available
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }

  // Fallback to email first 2 characters
  if (user.email && user.email.length >= 2) {
    return user.email.substring(0, 2).toUpperCase();
  }

  // Ultimate fallback
  return 'U';
}

export function UserMenu({ user, logout }: UserMenuProps) {
  const t = useTranslations();
  const initials = getUserInitials(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={t('nav.userMenu')}
        >
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.firstName && user.lastName && (
              <p className="font-medium text-sm">
                {user.firstName} {user.lastName}
              </p>
            )}
            <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
