import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

const UserSocketContext = createContext(null);

export const useUserSocket = () => useContext(UserSocketContext);

export function UserSocketProvider({ organizationId, children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tableUpdates, setTableUpdates] = useState(null);

  useEffect(() => {
    if (!organizationId) return undefined;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1200,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('organization:join', organizationId);
    });

    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (error) => {
      setConnected(false);
      console.error('Socket холболт амжилтгүй боллоо:', error.message);
    });

    newSocket.on('table:status_changed', (payload) => {
      setTableUpdates(payload);
    });

    newSocket.on('reservation:new', () => {
      setTableUpdates({ refresh: Date.now() });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('organization:leave', organizationId);
      newSocket.disconnect();
    };
  }, [organizationId]);

  const clearTableUpdate = useCallback(() => setTableUpdates(null), []);

  return (
    <UserSocketContext.Provider value={{ socket, connected, tableUpdates, clearTableUpdate }}>
      {children}
    </UserSocketContext.Provider>
  );
}
