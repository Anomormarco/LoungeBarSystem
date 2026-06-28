import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const playBeep = (time, freq, duration = 0.28) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 659.25);
    playBeep(now + 0.18, 987.77);
    playBeep(now + 0.42, 783.99, 0.36);
  } catch (err) {
    console.error('Notification sound error:', err);
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [spotlightNotification, setSpotlightNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('owner_user');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const orgId = user.organizationId;
    const originalTitle = document.title;
    let titleTimer = null;

    const flashTitle = (message) => {
      let active = false;
      clearInterval(titleTimer);
      titleTimer = setInterval(() => {
        document.title = active ? originalTitle : message;
        active = !active;
      }, 850);

      window.setTimeout(() => {
        clearInterval(titleTimer);
        document.title = originalTitle;
      }, 9000);
    };

    const showBrowserNotification = (notification) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      try {
        new Notification(notification.title, {
          body: notification.message,
          tag: `reservation-${notification.data?.id || notification.id}`,
          requireInteraction: false,
        });
      } catch (err) {
        console.error('Browser notification error:', err);
      }
    };

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1200,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('organization:join', orgId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      setConnected(false);
      console.error('Socket холболт амжилтгүй боллоо:', error.message);
    });

    newSocket.on('reservation:new', (reservation) => {
      playNotificationSound();

      const newNotif = {
        id: Date.now(),
        title: 'Шинэ захиалга ирлээ',
        message: `${reservation.guestName} (${reservation.guestCount} хүн, ширээ ${reservation.table?.tableNumber || reservation.tableId || ''}) захиалга өглөө.`,
        type: 'info',
        time: new Date(),
        data: reservation,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setSpotlightNotification(newNotif);
      setUnreadCount((prev) => prev + 1);
      flashTitle('Шинэ захиалга!');
      showBrowserNotification(newNotif);

      window.setTimeout(() => {
        setSpotlightNotification((current) => (current?.id === newNotif.id ? null : current));
      }, 10000);
    });

    newSocket.on('reservation:confirmed', (reservation) => {
      const newNotif = {
        id: Date.now(),
        title: 'Захиалга баталгаажлаа',
        message: `${reservation.guestName}-ийн захиалга баталгаажлаа.`,
        type: 'success',
        time: new Date(),
        data: reservation,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on('reservation:cancelled', (reservation) => {
      const newNotif = {
        id: Date.now(),
        title: 'Захиалга цуцлагдлаа',
        message: `${reservation.guestName}-ийн захиалга цуцлагдлаа.`,
        type: 'error',
        time: new Date(),
        data: reservation,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      clearInterval(titleTimer);
      document.title = originalTitle;
      newSocket.emit('organization:leave', orgId);
      newSocket.disconnect();
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    setSpotlightNotification(null);
    setUnreadCount(0);
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const dismissSpotlight = () => {
    setSpotlightNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        spotlightNotification,
        unreadCount,
        connected,
        clearNotifications,
        markAllAsRead,
        dismissSpotlight,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
