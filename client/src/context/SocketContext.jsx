import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Web Audio API Synthesizer to play reservation notification sound
export function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play double beep sound
    const playBeep = (time, freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + 0.35);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 587.33); // D5
    playBeep(now + 0.15, 880); // A5
  } catch (err) {
    console.error('Sound play error:', err);
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('owner_user');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const orgId = user.organizationId;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
      newSocket.emit('organization:join', orgId);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Listen to new reservation event
    newSocket.on('reservation:new', (reservation) => {
      console.log('New reservation received:', reservation);
      playNotificationSound();
      
      const newNotif = {
        id: Date.now(),
        title: 'Шинэ захиалга',
        message: `${reservation.guestName} (${reservation.guestCount} хүнтэй, Ширээ ${reservation.table?.tableNumber || ''}) захиалга өглөө.`,
        type: 'info',
        time: new Date(),
        data: reservation
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('reservation:confirmed', (reservation) => {
      console.log('Reservation confirmed:', reservation);
      const newNotif = {
        id: Date.now(),
        title: 'Захиалга баталгаажлаа',
        message: `${reservation.guestName}-ийн захиалга баталгаажлаа.`,
        type: 'success',
        time: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('reservation:cancelled', (reservation) => {
      console.log('Reservation cancelled:', reservation);
      const newNotif = {
        id: Date.now(),
        title: 'Захиалга цуцлагдлаа',
        message: `${reservation.guestName}-ийн захиалга цуцлагдлаа.`,
        type: 'error',
        time: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('organization:leave', orgId);
      newSocket.disconnect();
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, connected, clearNotifications, markAllAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};
