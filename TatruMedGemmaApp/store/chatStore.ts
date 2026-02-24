import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession, Message, Role } from '../types';
import 'react-native-get-random-values';

// Polyfill for crypto.randomUUID (using a simple random generator for now, or react-native-uuid)
const generateId = () => Math.random().toString(36).substring(2, 9);

const MAX_PERSISTED_SESSIONS = 25;
const MAX_PERSISTED_MESSAGES_PER_SESSION = 120;
const MAX_PERSISTED_MESSAGE_CHARS = 8000;

const sanitizePersistedMessage = (message: Message): Message => {
  const safeContent =
    message.content.length > MAX_PERSISTED_MESSAGE_CHARS
      ? `${message.content.slice(0, MAX_PERSISTED_MESSAGE_CHARS)}…`
      : message.content;

  const safeImageUri = message.imageUri?.startsWith('data:') ? undefined : message.imageUri;

  return {
    ...message,
    content: safeContent,
    imageUri: safeImageUri,
  };
};

const sanitizePersistedSessions = (sessions: ChatSession[]): ChatSession[] => {
  return sessions.slice(0, MAX_PERSISTED_SESSIONS).map((session) => ({
    ...session,
    messages: session.messages
      .slice(-MAX_PERSISTED_MESSAGES_PER_SESSION)
      .map(sanitizePersistedMessage),
  }));
};

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  actions: {
    createNewSession: () => string;
    addMessage: (sessionId: string, role: Role, content: string, imageUri?: string) => void;
    deleteSession: (sessionId: string) => void;
    selectSession: (sessionId: string) => void;
    clearAllSessions: () => void;
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      actions: {
        createNewSession: () => {
          const newSessionId = generateId();
          const newSession: ChatSession = {
            id: newSessionId,
            title: `New Chat ${new Date().toLocaleTimeString()}`,
            messages: [],
            createdAt: Date.now(),
            lastUpdated: Date.now(),
          };

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSessionId,
          }));
          return newSessionId;
        },

        addMessage: (sessionId, role, content, imageUri) => {
          const newMessage: Message = {
            id: generateId(),
            role,
            content,
            timestamp: Date.now(),
            imageUri,
          };

          set((state) => {
            const updatedSessions = state.sessions.map((session) => {
              if (session.id === sessionId) {
                // Update title based on first user message if it's "New Chat..."
                let newTitle = session.title;
                if (session.messages.length === 0 && role === 'user') {
                  newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
                }

                return {
                  ...session,
                  messages: [...session.messages, newMessage],
                  lastUpdated: Date.now(),
                  title: newTitle,
                };
              }
              return session;
            });
            
            // Move updated session to top
            updatedSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);

            return { sessions: updatedSessions };
          });
        },

        deleteSession: (sessionId) => {
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSessionId:
              state.currentSessionId === sessionId ? null : state.currentSessionId,
          }));
        },

        selectSession: (sessionId) => {
          set({ currentSessionId: sessionId });
        },

        clearAllSessions: () => {
          set({ sessions: [], currentSessionId: null });
        },
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: sanitizePersistedSessions(state.sessions),
      }),
    }
  )
);
