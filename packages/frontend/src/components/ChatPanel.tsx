import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { SOCKET_EVENTS, type ChatMessage } from '@games/shared';

const EMOTES = ['😂', '🔥', '👀', '💀', '😳', '🤭', '👏', '😈'];

interface Props {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: Props) {
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (!open) setUnread((n) => n + 1);
    });
    return () => { socket.off(SOCKET_EVENTS.CHAT_MESSAGE); };
  }, [socket, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  function send(message: string, type: 'text' | 'emote' = 'text') {
    if (!message.trim() || !socket) return;
    socket.emit(SOCKET_EVENTS.SEND_CHAT, { message: message.trim(), type });
    setInput('');
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg z-40 transition-colors"
      >
        <span className="text-xl">💬</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 w-80 max-h-[70vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="font-semibold text-sm">Game Chat</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 && (
              <p className="text-gray-600 text-xs text-center py-4">No messages yet</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-2 items-start">
                {msg.photoURL && (
                  <img src={msg.photoURL} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="text-xs text-gray-400">{msg.displayName} </span>
                  {msg.type === 'emote' ? (
                    <span className="text-2xl">{msg.message}</span>
                  ) : (
                    <p className="text-sm text-gray-100 break-words">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Emotes */}
          <div className="flex gap-1 px-3 py-2 border-t border-gray-800 overflow-x-auto">
            {EMOTES.map((e) => (
              <button
                key={e}
                onClick={() => send(e, 'emote')}
                className="text-xl shrink-0 hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 pb-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Say something…"
              className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none"
              maxLength={500}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
