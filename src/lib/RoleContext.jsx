import React, { createContext, useState, useContext, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('user');

  useEffect(() => {
    const saved = localStorage.getItem('sila_current_role');
    if (saved) setCurrentRole(saved);
  }, []);

  const switchRole = (role) => {
    if (['user', 'provider'].includes(role)) {
      setCurrentRole(role);
      localStorage.setItem('sila_current_role', role);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, switchRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);