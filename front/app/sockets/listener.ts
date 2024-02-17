import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { EventTypes } from '../entities/event.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const useSocketListener = (
  onMessage: (event: EventTypes, data: any) => void,
) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(API_URL);

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.onAny(onMessage);
    }
  }, [socket]);

  return socket;
};

export default useSocketListener;
