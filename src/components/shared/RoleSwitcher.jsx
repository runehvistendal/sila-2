import React from 'react';
import { useRole } from '@/lib/RoleContext';
import { Button } from '@/components/ui/button';
import { Anchor, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RoleSwitcher() {
  const { currentRole, switchRole } = useRole();

  const roleConfig = {
    user: {
      label: 'Bruger',
      icon: User,
      description: 'Almindelig bruger',
    },
    provider: {
      label: 'Udbyder',
      icon: Anchor,
      description: 'Transport eller Hytte udbyder',
    },
  };

  const currentConfig = roleConfig[currentRole];
  const CurrentIcon = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full"
        >
          <CurrentIcon className="w-4 h-4" />
          {currentConfig.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skift tilstand</div>
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          const isActive = currentRole === role;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => switchRole(role)}
              className={`flex items-center gap-2 cursor-pointer ${isActive ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
              {isActive && <span className="ml-auto text-primary font-bold">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}