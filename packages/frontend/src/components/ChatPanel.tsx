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
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40 text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
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
        <div className="fixed bottom-20 right-4 w-80 max-h-[70vh] bg-playhouse-surface border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="font-display font-semibold text-sm text-playhouse-text-primary">Game Chat</span>
            <button onClick={() => setOpen(false)} className="text-playhouse-text-tertiary hover:text-playhouse-text-primary text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 && (
              <p className="text-playhouse-text-tertiary text-xs text-center py-4">No messages yet</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-2 items-start">
                {msg.photoURL && (
                  <img src={msg.photoURL} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="text-xs text-playhouse-text-secondary">{msg.displayName} </span>
                  {msg.type === 'emote' ? (
                    <span className="text-2xl">{msg.message}</span>
                  ) : (
                    <p className="text-sm text-playhouse-text-primary break-words">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Emotes */}
          <div className="flex gap-1 px-3 py-2 border-t border-white/[0.06] overflow-x-auto">
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
              className="flex-1 bg-playhouse-bg rounded-lg px-3 py-2 text-sm text-playhouse-text-primary placeholder:text-playhouse-text-tertiary outline-none"
              maxLength={500}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
