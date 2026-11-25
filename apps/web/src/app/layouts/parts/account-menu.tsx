import type { Me } from '@fixit/contracts';
import { ChevronDown, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks';
import { initialsOf } from '@/lib/format';
import { accountMenuItems } from '../nav-config';

export function AccountMenu({ me }: { me: Me }) {
  const logout = useLogout();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${me.fullName}`}
        className="text-text-muted inline-flex min-h-11 items-center gap-1 rounded-full"
      >
        <span className="bg-primary-soft text-label text-primary grid size-10 place-items-center rounded-full font-extrabold">
          {initialsOf(me.fullName)}
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-4 lg:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-label text-text font-bold">{me.fullName}</span>
          <span className="text-meta text-text-subtle break-all font-normal">{me.email}</span>
        </DropdownMenuLabel>
        {accountMenuItems(me).map(({ label, to, icon: Icon }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to}>
              <Icon aria-hidden="true" className="text-text-muted size-[18px]" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout();
          }}
          className="hover:text-danger-text focus:text-danger-text"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
