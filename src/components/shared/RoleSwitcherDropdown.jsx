import React from 'react';
import { useRole } from '@/lib/RoleContext';

export default function RoleSwitcherDropdown() {
  const { activeRole, setActiveRole } = useRole();

  return (
    <label className="flex items-center gap-3 cursor-pointer w-full px-2 py-1.5">
      <span className="text-sm flex-1">
        {activeRole === 'guest' ? 'Bruger' : 'Vært'}
      </span>
      <input
        type="checkbox"
        checked={activeRole === 'host'}
        onChange={(e) => setActiveRole(e.target.checked ? 'host' : 'guest')}
        className="w-4 h-4 rounded accent-primary"
      />
    </label>
  );
}