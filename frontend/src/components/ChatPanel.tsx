import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { ArrowLeft, BellOff, MessageSquare, MoreHorizontal, Plus, Search, Send, SquarePen, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { TravelGroup } from "../services/mappingApi";
import { readLocalTable, upsertLocalRow, writeLocalTable } from "../services/localDb";
import { GAMIFIED_USERS, getLevelFromXp } from "./gamification";

type Msg = {
  id: number;
  from: "me" | "them";
  senderName?: string;
  text: string;
  time: string;
  read: boolean;
};

type Conv = {
  id: number;
  name: string;
  avatarBackground: string;
  initials: string;
  lastMessage: string;
  time: string;
  online: boolean;
  unread: boolean;
  muted?: boolean;
  isGroup?: boolean;
  label?: string;
  gamifiedKey?: string;
  messages: Msg[];
};

const REACTIONS = ["Nice", "Love it", "Great view", "Send pin"];

type LocalConversationRow = Omit<Conv, "messages"> & {
  ownerId: string;
  updatedAt: string;
};

type LocalMessageRow = Msg & {
  conversationId: number;
  ownerId: string;
  createdAt: string;
};

function readLocalConversations(ownerId: string): Conv[] {
  const conversations = readLocalTable<LocalConversationRow>("conversations")
    .filter((row) => row.ownerId === ownerId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const messages = readLocalTable<LocalMessageRow>("messages")
    .filter((row) => row.ownerId === ownerId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return conversations.map(({ ownerId: _ownerId, updatedAt: _updatedAt, ...conversation }) => ({
    ...conversation,
    messages: messages
      .filter((message) => message.conversationId === conversation.id)
      .map(({ conversationId: _conversationId, ownerId: _messageOwnerId, createdAt: _createdAt, ...message }) => message),
  }));
}

function writeLocalConversations(ownerId: string, conversations: Conv[]) {
  const now = new Date().toISOString();
  const existingConversations = readLocalTable<LocalConversationRow>("conversations").filter((row) => row.ownerId !== ownerId);
  const existingMessages = readLocalTable<LocalMessageRow>("messages").filter((row) => row.ownerId !== ownerId);
  const conversationRows: LocalConversationRow[] = conversations.map(({ messages: _messages, ...conversation }) => ({
    ...conversation,
    ownerId,
    updatedAt: now,
  }));
  const messageRows: LocalMessageRow[] = conversations.flatMap((conversation) =>
    conversation.messages.map((message, index) => ({
      ...message,
      conversationId: conversation.id,
      ownerId,
      createdAt: new Date(Date.now() + index).toISOString(),
    })),
  );
  writeLocalTable("conversations", [...conversationRows, ...existingConversations]);
  writeLocalTable("messages", [...messageRows, ...existingMessages]);
}

function TypingIndicator() {
  return (
    <div className="flex w-fit gap-1 rounded-[14px_14px_14px_4px] bg-white px-3 py-2 shadow-sm">
      {[0, 1, 2].map((index) => (
        <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#9E6B5C]" style={{ animation: `typingDot 1.2s ${index * 0.2}s infinite ease-in-out` }} />
      ))}
    </div>
  );
}

function MessageThreadView({
  conv,
  onBack,
  onUpdateConversation,
  onViewProfile,
}: {
  conv: Conv;
  onBack: () => void;
  onUpdateConversation: (convId: number, messages: Msg[], lastMessage: string, unread: boolean) => void;
  onViewProfile: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(conv.messages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profile = conv.gamifiedKey ? GAMIFIED_USERS[conv.gamifiedKey] : null;
  const level = profile ? getLevelFromXp(profile.xp) : null;

  useEffect(() => {
    setMessages(conv.messages);
  }, [conv.id, conv.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMsg = (quickText?: string) => {
    const text = (quickText ?? input).trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Msg = { id: Date.now(), from: "me", text, time, read: true };
    const sentMessages = [...messages, newMsg];
    setMessages(sentMessages);
    setInput("");
    setShowReactions(false);
    onUpdateConversation(conv.id, sentMessages, `You: ${text}`, false);

    setIsTyping(true);
    window.setTimeout(() => {
      const sender = conv.isGroup ? (conv.id === 2 ? "Lea" : conv.id === 3 ? "Pio" : conv.id === 6 ? "Rose" : "Karl") : conv.name;
      const replyText = conv.id === 2
        ? "Yes, Sagada is worth it. Try sunrise coffee after Kiltepan."
        : conv.id === 3
          ? "Siargao is very welcoming to solo travelers."
          : conv.id === 6
            ? "Safe travels always, TravelTraces community."
            : "That sounds amazing. Let's travel soon.";
      const botMsg: Msg = { id: Date.now() + 1, from: "them", senderName: sender, text: replyText, time, read: false };
      setMessages((current) => {
        const next = [...current, botMsg];
        onUpdateConversation(conv.id, next, conv.isGroup ? `${sender}: ${replyText}` : replyText, true);
        return next;
      });
      setIsTyping(false);
    }, 1200 + Math.random() * 600);
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F0E8]">
      <div className="flex shrink-0 items-center gap-3 border-b border-[#3A2A22]/10 bg-[#3A2A22] px-4 py-3">
        <button onClick={onBack} className="grid min-h-10 min-w-10 place-items-center rounded-full text-[#F5F0E8] transition hover:bg-[#F5F0E8]/10" aria-label="Back to chats">
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          onClick={onViewProfile}
          disabled={!conv.gamifiedKey}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-[var(--font-label)] text-sm font-bold text-[#F5F0E8]"
          style={{ backgroundColor: conv.avatarBackground, cursor: conv.gamifiedKey ? "pointer" : "default" }}
        >
          {conv.initials}
        </button>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#F5F0E8]">{conv.name}</span>
            {level ? <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold text-[#F5F0E8]" style={{ backgroundColor: level.color }}>LV{level.level}</span> : null}
          </div>
          <span className="text-[11px] text-[#BFD1B7]">{conv.online ? "Active now" : conv.isGroup ? "Travel thread" : "Travel member"}</span>
        </div>
      </div>

      <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F5F0E8] p-4">
        {messages.map((msg, index) => {
          const isMe = msg.from === "me";
          const showSenderName = conv.isGroup && !isMe && (index === 0 || messages[index - 1]?.senderName !== msg.senderName);
          return (
            <div key={msg.id} className={`flex max-w-[85%] flex-col ${isMe ? "self-end items-end" : "self-start items-start"}`}>
              {showSenderName ? <span className="mb-1 ml-1 text-[10px] text-[#9E6B5C]">{msg.senderName}</span> : null}
              <div className={`rounded-2xl px-3 py-2 text-left text-[13px] leading-6 shadow-sm ${isMe ? "rounded-br-sm bg-[#3A2A22] text-[#F5F0E8]" : "rounded-bl-sm bg-white text-[#1A1A1A]"}`}>{msg.text}</div>
              <span className="mt-1 text-[9px] text-[#6B6B5A]">{msg.time}</span>
            </div>
          );
        })}
        {isTyping ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>

      {showReactions ? (
        <div className="flex gap-2 border-t border-[#3A2A22]/10 bg-[#EDEAE0] px-4 py-2">
          {REACTIONS.map((reaction) => (
            <button key={reaction} type="button" onClick={() => sendMsg(reaction)} className="rounded-full border border-[#3A2A22]/15 px-3 py-1 text-xs font-semibold text-[#3A2A22] transition hover:bg-[#F5F0E8]">
              {reaction}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-2 border-t border-[#3A2A22]/10 bg-[#EDEAE0] p-3">
        <button type="button" onClick={() => setShowReactions((value) => !value)} className={`min-h-9 rounded-full px-3 text-xs font-bold ${showReactions ? "bg-[#C4713A] text-[#F5F0E8]" : "text-[#3A2A22] hover:bg-[#F5F0E8]"}`}>
          React
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMsg();
          }}
          placeholder="Type a message..."
          className="min-h-10 min-w-0 flex-1 rounded-full border border-[#3A2A22]/15 bg-[#F5F0E8] px-4 text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6B5A] focus:border-[#3A2A22]"
        />
        <button type="button" onClick={() => sendMsg()} className="grid min-h-10 min-w-10 place-items-center rounded-full bg-[#3A2A22] text-[#F5F0E8] transition hover:bg-[#4B352A]" aria-label="Send message">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ownerId = user?.id ?? "guest";
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeTab, setActiveTab] = useState<"Friends" | "Events" | "Unread">("Friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupNote, setGroupNote] = useState("");

  useEffect(() => {
    const refreshConversations = () => setConversations(readLocalConversations(ownerId));
    refreshConversations();
    window.addEventListener("traveltraces:local-db-updated", refreshConversations);
    window.addEventListener("storage", refreshConversations);
    return () => {
      window.removeEventListener("traveltraces:local-db-updated", refreshConversations);
      window.removeEventListener("storage", refreshConversations);
    };
  }, [ownerId]);

  const updateConversationState = (updater: (current: Conv[]) => Conv[]) => {
    setConversations((current) => {
      const next = updater(current);
      window.setTimeout(() => writeLocalConversations(ownerId, next), 0);
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab("Friends");
    setActiveConvId(null);
    setOptionsOpen(false);
    setCreateGroupOpen(false);
    setSearchQuery("");
  }, [open]);

  if (!open) return null;

  const activeConv = activeConvId ? conversations.find((conv) => conv.id === activeConvId) ?? null : null;
  const filtered = conversations.filter((conv) => {
    const text = `${conv.name} ${conv.label ?? ""} ${conv.lastMessage}`.toLowerCase();
    if (!text.includes(searchQuery.toLowerCase())) return false;
    if (activeTab === "Friends") return !conv.isGroup;
    if (activeTab === "Events") return !!conv.isGroup;
    return conv.unread;
  });
  const handleSelectConv = (conv: Conv) => {
    setActiveConvId(conv.id);
    if (conv.unread) {
      updateConversationState((current) => current.map((item) => (item.id === conv.id ? { ...item, unread: false } : item)));
    }
  };

  const handleUpdateConversation = (convId: number, messages: Msg[], lastMessage: string, unread: boolean) => {
    updateConversationState((current) => current.map((conv) => (conv.id === convId ? { ...conv, messages, lastMessage, time: "Just now", unread } : conv)));
  };

  const handleCreateGroup = () => {
    const name = groupName.trim();
    if (!name) return;
    const note = groupNote.trim() || "New travel group created.";
    const nextId = Math.max(...conversations.map((conv) => conv.id), 0) + 1;
    const created: Conv = {
      id: nextId,
      name,
      avatarBackground: "#3A2A22",
      initials: name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase().slice(0, 2) || "G",
      lastMessage: `You: ${note}`,
      time: "Just now",
      online: false,
      unread: false,
      isGroup: true,
      label: "Travel Group",
      messages: [
        { id: Date.now(), from: "me", text: note, time: "Just now", read: true },
      ],
    };
    updateConversationState((current) => [created, ...current]);
    const now = new Date().toISOString();
    const group: TravelGroup = {
      circle_id: `chat-group-${nextId}`,
      group_id: `chat-group-${nextId}`,
      name,
      owner_id: ownerId,
      members: [{
        user_id: ownerId,
        display_name: user?.name ?? "You",
        role: "Organizer",
        phone: "",
        avatar: user?.avatar ?? "",
        admin: true,
        location_sharing_enabled: true,
        joined_at: now,
      }],
      created_at: now,
      updated_at: now,
    };
    upsertLocalRow<TravelGroup>("travelGroups", group, (item) => item.circle_id);
    setActiveTab("Events");
    setActiveConvId(nextId);
    setGroupName("");
    setGroupNote("");
    setCreateGroupOpen(false);
    setOptionsOpen(false);
  };

  return createPortal(
    <>
      <style>{`
        @keyframes slideInChat { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
        .custom-scrollbar { scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div onClick={onClose} className="fixed inset-0 z-[1000] bg-[#3A2A22]/28 backdrop-blur-[2px]" />
      <aside className="fixed bottom-0 right-0 top-0 z-[1001] flex w-full max-w-[360px] animate-[slideInChat_0.25s_cubic-bezier(0.16,1,0.3,1)] flex-col overflow-hidden bg-[#F5F0E8] shadow-[0_0_40px_rgba(58,42,34,0.28)]">
        {activeConv ? (
          <MessageThreadView
            conv={activeConv}
            onBack={() => setActiveConvId(null)}
            onUpdateConversation={handleUpdateConversation}
            onViewProfile={() => {
              if (!activeConv.gamifiedKey) return;
              onClose();
              navigate(`/profile/${activeConv.gamifiedKey}`);
            }}
          />
        ) : (
          <>
            <div className="shrink-0 px-4 pb-2 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-[var(--font-display)] text-xl font-bold text-[#3A2A22]">Chats</span>
                <div className="flex gap-2">
                  <button title="Compose message" className="grid min-h-8 min-w-8 place-items-center rounded-full bg-[#3A2A22]/10 text-[#3A2A22] transition hover:bg-[#3A2A22]/15">
                    <SquarePen size={16} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      title="Options"
                      onClick={() => setOptionsOpen((value) => !value)}
                      className="grid min-h-8 min-w-8 place-items-center rounded-full bg-[#3A2A22]/10 text-[#3A2A22] transition hover:bg-[#3A2A22]/15"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {optionsOpen ? (
                      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-48 overflow-hidden rounded-lg border border-[#3A2A22]/15 bg-[#F5F0E8] shadow-[0_18px_40px_rgba(58,42,34,0.2)]">
                        <button
                          type="button"
                          onClick={() => {
                            setCreateGroupOpen(true);
                            setOptionsOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-[#3A2A22] transition hover:bg-[#EDEAE0]"
                        >
                          <Users size={15} />
                          Create a Group
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <button onClick={onClose} title="Close panel" className="ml-1 grid min-h-8 min-w-8 place-items-center rounded-full bg-[#C4713A]/15 text-[#C4713A] transition hover:bg-[#C4713A]/25">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="relative mb-3">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9E6B5C]" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="min-h-9 w-full rounded-full border border-[#3A2A22]/10 bg-white pl-9 pr-3 text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6B5A] focus:ring-2 focus:ring-[#9E6B5C]/30"
                />
              </div>

              <div className="flex gap-2">
                {(["Friends", "Events", "Unread"] as const).map((tab) => {
                  const selected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`min-h-9 rounded-full px-3 text-xs font-bold transition ${selected ? "bg-[#3A2A22] text-[#F5F0E8]" : "text-[#3A2A22] hover:bg-[#3A2A22]/10"}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto pb-6">
              {filtered.map((conv) => (
                <button key={conv.id} type="button" onClick={() => handleSelectConv(conv)} className="flex w-full items-center px-4 py-3 text-left transition hover:bg-[#EDEAE0]">
                  <span className="relative mr-3 shrink-0">
                    <span className="grid h-[42px] w-[42px] place-items-center rounded-full font-[var(--font-label)] text-sm font-bold text-[#F5F0E8]" style={{ backgroundColor: conv.avatarBackground }}>
                      {conv.initials}
                    </span>
                    {conv.online ? <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#F5F0E8] bg-[#22c55e]" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    {conv.label ? <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-[0.05em] text-[#9E6B5C]">{conv.label}</span> : null}
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#1A1A1A]">{conv.name}</span>
                      <span className="shrink-0 text-[11px] text-[#6B6B5A]">{conv.time}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-[#6B6B5A]">{conv.lastMessage}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {conv.muted ? <BellOff size={11} className="text-[#9E6B5C]" /> : null}
                        {conv.unread ? <span className="h-2 w-2 rounded-full bg-[#C4713A]" /> : null}
                      </span>
                    </span>
                  </span>
                </button>
              ))}

              {!filtered.length ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare size={32} className="mx-auto mb-3 text-[#9E6B5C] opacity-50" />
                  <p className="text-sm text-[#6B6B5A]">No conversations found.</p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </aside>
      {createGroupOpen ? (
        <div className="fixed inset-0 z-[1003] grid place-items-center bg-[#1A1A1A]/45 px-4 backdrop-blur-sm" onClick={() => setCreateGroupOpen(false)}>
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateGroup();
            }}
            className="w-full max-w-[430px] rounded-xl border border-[#3A2A22]/15 bg-[#F5F0E8] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#C4713A]">Travel group</p>
                <h2 className="m-0 font-[var(--font-display)] text-3xl font-semibold leading-tight text-[#3A2A22]">Create a Group</h2>
              </div>
              <button type="button" onClick={() => setCreateGroupOpen(false)} className="grid min-h-9 min-w-9 place-items-center rounded-full bg-[#3A2A22]/10 text-[#3A2A22] transition hover:bg-[#3A2A22]/15" aria-label="Close create group">
                <X size={17} />
              </button>
            </div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#6B6B5A]" htmlFor="chat-group-name">
              Group name
            </label>
            <input
              id="chat-group-name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Example: Cebu Weekend Crew"
              className="mb-3 min-h-11 w-full rounded-lg border border-[#3A2A22]/15 bg-white px-3 text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6B5A] focus:border-[#3A2A22]"
              autoFocus
            />
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#6B6B5A]" htmlFor="chat-group-note">
              First message
            </label>
            <textarea
              id="chat-group-note"
              value={groupNote}
              onChange={(event) => setGroupNote(event.target.value)}
              placeholder="Add the first planning note for this group..."
              rows={4}
              className="mb-4 w-full resize-none rounded-lg border border-[#3A2A22]/15 bg-white px-3 py-2 text-sm leading-6 text-[#1A1A1A] outline-none placeholder:text-[#6B6B5A] focus:border-[#3A2A22]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateGroupOpen(false)} className="min-h-10 rounded-full border border-[#3A2A22]/15 px-4 text-sm font-bold text-[#3A2A22] transition hover:bg-[#EDEAE0]">
                Cancel
              </button>
              <button type="submit" disabled={!groupName.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#3A2A22] px-4 text-sm font-bold text-[#F5F0E8] transition hover:bg-[#4B352A] disabled:cursor-default disabled:bg-[#D8D4C8]">
                <Plus size={15} />
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {!user ? <span className="sr-only">Chat preview mode</span> : null}
    </>,
    document.body,
  );
}
