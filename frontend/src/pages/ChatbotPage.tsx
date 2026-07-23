import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  Copy,
  HelpCircle,
  ImagePlus,
  Map,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Route,
  Send,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Utensils,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { requestTraceReply, type ChatApiMessage } from "../services/chatApi";
import { fetchPins, type Pins } from "../services/chatpinApi";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status: "sent" | "failed";
  bookmarked?: boolean;
};

type ChatPayload = {
  route: "/chat";
  ownerId: string;
  conversationId?: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type QuickAction = {
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
  accent: string;
};

const CHAT_STORAGE_KEY = "traveltraces.aiChat.v1";
const CHAT_LAST_PROMPT_KEY = "traveltraces.aiChat.lastUserPromptJson";

const quickActions: QuickAction[] = [
  {
    title: "Plan a Trip",
    description: "Create a personalized multi-stop itinerary based on destination, dates, and budget.",
    prompt: "Plan a multi-stop trip with dates, budget, and route flow.",
    icon: Map,
    accent: "#4C8FA8",
  },
  {
    title: "Discover Hidden Gems",
    description: "Find lesser-known beaches, cafes, viewpoints, hiking trails, and cultural places nearby.",
    prompt: "Find hidden gems near me for beaches, cafes, viewpoints, and cultural attractions.",
    icon: MapPin,
    accent: "#C96F4A",
  },
  {
    title: "Build an Itinerary",
    description: "Generate an optimized route and prepare it for the TravelTraces map.",
    prompt: "Build an optimized travel route and show the stops I should pin on the map.",
    icon: Route,
    accent: "#507255",
  },
  {
    title: "Create a Travel Story",
    description: "Transform a completed journey into a polished, memory-rich TravelTraces story.",
    prompt: "Turn my completed journey into a warm TravelTraces story.",
    icon: BookOpen,
    accent: "#D9A441",
  },
  {
    title: "Food Trail",
    description: "Discover restaurants, local delicacies, cafes, and street food worth tracing.",
    prompt: "Create a food adventure with local delicacies, cafes, and street food stops.",
    icon: Utensils,
    accent: "#C96F4A",
  },
  {
    title: "Travel Circles",
    description: "Suggest groups, events, and explorers with similar travel interests.",
    prompt: "Find travel communities, events, and fellow explorers with similar interests.",
    icon: Users,
    accent: "#507255",
  },
];

const sidebarSections = [
  {
    label: "Library",
    items: [
      { label: "Saved Conversations", icon: Bookmark },
      { label: "Pinned Trips", icon: Pin },
      { label: "Draft Stories", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "User Profile", icon: User },
      { label: "Settings", icon: Settings },
      { label: "Help", icon: HelpCircle },
    ],
  },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function readChatPayload(ownerId: string): ChatPayload {
  if (typeof window === "undefined") return { route: "/chat", ownerId, messages: [], updatedAt: new Date().toISOString() };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHAT_STORAGE_KEY) ?? "null") as ChatPayload | null;
    if (parsed?.route === "/chat" && parsed.ownerId === ownerId && Array.isArray(parsed.messages)) return parsed;
  } catch {
    return { route: "/chat", ownerId, messages: [], updatedAt: new Date().toISOString() };
  }
  return { route: "/chat", ownerId, messages: [], updatedAt: new Date().toISOString() };
}

function writeChatPayload(payload: ChatPayload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("traveltraces:ai-chat-updated", { detail: { route: "/chat" } }));
}

function MarkdownLite({ text }: { text: string }) {
  return (
    <div className="tt-ai-markdown">
      {text.split(/\n{2,}/).map((block) => (
        <p key={block}>{block}</p>
      ))}
    </div>
  );
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const ownerId = user?.id ?? "guest";
  const displayName = user?.name?.split(" ")[0] || "Traveler";
  const [messages, setMessages] = useState<ChatMessage[]>(() => readChatPayload(ownerId).messages);
  const [conversationId, setConversationId] = useState<string | undefined>(() => readChatPayload(ownerId).conversationId);
  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [travelIdeasOpen, setTravelIdeasOpen] = useState(() => readChatPayload(ownerId).messages.length === 0);
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [pins, setPins] = useState<Pins[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);

  const payload = useMemo<ChatPayload>(() => ({ route: "/chat", ownerId, conversationId, messages, updatedAt: new Date().toISOString() }), [conversationId, messages, ownerId]);
  const recentChats = messages.filter((message) => message.role === "user").slice(-3).reverse();

  useEffect(() => {
    const storedChat = readChatPayload(ownerId);
    setMessages(storedChat.messages);
    setConversationId(storedChat.conversationId);
    setTravelIdeasOpen(storedChat.messages.length === 0);
  }, [ownerId]);

  useEffect(() => {
    writeChatPayload(payload);
  }, [payload]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    if (!ownerId || ownerId === "guest") return;

    const loadPins = async () => {
      try {
        setPinsLoading(true);

        const data = await fetchPins(ownerId);

        setPins(data.pins);
      } catch (err) {
        console.error("Failed to fetch pins", err);
        setPins([]);
      } finally {
        setPinsLoading(false);
      }
    };

    void loadPins();
  }, [ownerId]);

  const persistLastPrompt = (message: ChatMessage) => {
    const promptJson = {
      route: "/chat",
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    };
    window.localStorage.setItem(CHAT_LAST_PROMPT_KEY, JSON.stringify(promptJson));
  };

  const sendMessage = async (preset?: string) => {
    
    const content = (preset ?? input).trim();

    if (!content || typing) return;

    const requiresPins =
      /\b(route|itinerary|nearby|closest|around|near|map|directions|travel\s*plan|my\s*pins|saved\s*places)\b/i.test(
        content
      );

    if (requiresPins && pinsLoading) {
      setToast("Loading your saved locations...");
      return;
    }

    const userMessage: ChatMessage = {
      id: createId("chat-user"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    setMessages((previous) => [...previous, userMessage]);
    persistLastPrompt(userMessage);

    setInput("");
    setTravelIdeasOpen(false);
    setTyping(true);

    try {
      // Include the newest user message in the history
      const history: ChatApiMessage[] = [...messages, userMessage]
        .filter((message) => message.status === "sent")
        .slice(-30)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          created_at: message.createdAt,
        }));

      const response = await requestTraceReply({
        route: "/chat",
        owner_id: ownerId,
        conversation_id: conversationId,

        message: {
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
          created_at: userMessage.createdAt,
        },

        history,

        context: {
          display_name: user?.name,
          location: user?.location,
          interests: user?.interests ?? [],

          // Only send pins if the question actually needs them
          pins: requiresPins ? pins : [],
        },
      });

      setConversationId(response.conversation_id);

      const assistantMessage: ChatMessage = {
        id: response.message.id,
        role: "assistant",
        content: response.message.content,
        createdAt: response.message.created_at,
        status: "sent",
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Trace couldn't complete that request. Please try again.";

      setMessages((previous) => [
        ...previous,
        {
          id: createId("chat-error"),
          role: "assistant",
          content: errorMessage,
          createdAt: new Date().toISOString(),
          status: "failed",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput("");
    setTravelIdeasOpen(true);
    setToast("New chat started");
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard?.writeText(content);
    setToast("Copied");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) setToast("Upload ready");
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (Array.from(event.clipboardData.files).some((file) => file.type.startsWith("image/"))) setToast("Image pasted");
  };

  const toggleBookmark = (id: string) => {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, bookmarked: !message.bookmarked } : message)));
  };

  return (
    <section className={`tt-ai-page ${sidebarCollapsed ? "tt-ai-page--collapsed" : ""}`}>
      {mobileSidebarOpen ? <button type="button" className="tt-ai-overlay" aria-label="Close sidebar" onClick={() => setMobileSidebarOpen(false)} /> : null}

      <div className="tt-ai-shell">

      <aside className={`tt-ai-sidebar ${mobileSidebarOpen ? "tt-ai-sidebar--open" : ""}`} aria-label="Trace AI navigation">
        <div className="tt-ai-sidebar-head">
          <div className="tt-ai-brand" title="Trace">
            <span>Trace</span>
          </div>
          <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <button type="button" className="tt-ai-new-chat" onClick={newChat} title="New Chat">
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        <div className="tt-ai-recent">
          <p>Recent Chats</p>
          {recentChats.length ? (
            recentChats.map((message) => (
              <button key={message.id} type="button" title={message.content}>
                <MessageSquare size={16} />
                <span>{message.content}</span>
              </button>
            ))
          ) : (
            <span>No recent chats yet</span>
          )}
        </div>

        {sidebarSections.map((section) => (
          <div key={section.label} className="tt-ai-side-section">
            <p>{section.label}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" title={item.label}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        <div className="tt-ai-profile" title={user?.name || "Guest Traveler"}>
          <span>{(user?.name || "T").slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.name || "Guest Traveler"}</strong>
            <small>Travel workspace</small>
          </div>
        </div>
      </aside>

      <main className="tt-ai-main">
        <button type="button" className="tt-ai-mobile-menu" onClick={() => setMobileSidebarOpen(true)} aria-label="Open sidebar">
          <Menu size={20} />
        </button>

        <div className="tt-ai-center">
          {!messages.length ? (
            <header className="tt-ai-empty">
              <h2>{greeting()}, {displayName}.</h2>
              <span>Where would you like to go next? Trace can plan the route, find meaningful stops, or help shape the story afterward.</span>
            </header>
          ) : (
            <div className="tt-ai-messages" aria-live="polite">
              {messages.map((message, messageIndex) => (
                <article key={message.id} className={`tt-ai-message tt-ai-message--${message.role}`}>
                  <div className="tt-ai-message-meta">
                    <span>{message.role === "assistant" ? "Trace" : user?.name || "You"}</span>
                    <small>{timeLabel(message.createdAt)}</small>
                  </div>
                  <div className="tt-ai-message-card">
                    {message.role === "assistant" ? <MarkdownLite text={message.content} /> : <p>{message.content}</p>}
                  </div>
                  <div className="tt-ai-message-actions">
                    {message.role === "assistant" && message.status === "sent" ? (
                      <>
                        <button type="button" onClick={() => void copyMessage(message.content)}><Copy size={14} /> Copy</button>
                        <button type="button">Save</button>
                        <button type="button" onClick={() => toggleBookmark(message.id)}><Bookmark size={14} /> Bookmark</button>
                        <button type="button"><Pin size={14} /> Pin to Map</button>
                        <button type="button"><Route size={14} /> Add to Travel Plan</button>
                        <button type="button"><Share2 size={14} /> Share</button>
                        <button type="button" onClick={() => void sendMessage(messages.slice(0, messageIndex).reverse().find((row) => row.role === "user")?.content)}><RefreshCw size={14} /> Regenerate</button>
                      </>
                    ) : message.role === "assistant" ? (
                      <button type="button" onClick={() => void sendMessage(messages.slice(0, messageIndex).reverse().find((row) => row.role === "user")?.content)}><RefreshCw size={14} /> Retry</button>
                    ) : (
                      <>
                        <button type="button" onClick={() => setInput(message.content)}>Edit</button>
                        <button type="button" onClick={() => void sendMessage(message.content)}>Retry</button>
                        <button type="button" onClick={() => setMessages((current) => current.filter((row) => row.id !== message.id))}><Trash2 size={14} /> Delete</button>
                      </>
                    )}
                  </div>
                </article>
              ))}
              {typing ? (
                <div className="tt-ai-typing">
                  <span><Navigation size={14} /></span>
                  Planning your next adventure...
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="tt-ai-composer-wrap" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
            <div className="tt-ai-composer">
              <textarea
                ref={textAreaRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (event.target.value.trim()) {
                    setTravelIdeasOpen(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={1}
                placeholder="Ask Trace to plan a 3-day trip, find a hidden beach, or turn your journey into a story..."
              />
              <div className="tt-ai-composer-row">
                <div className="tt-ai-left-tools">
                  <button type="button" title="Add Attachment" aria-label="Add Attachment"><Paperclip size={16} /></button>
                  <button type="button" title="Upload Photo" aria-label="Upload Photo"><ImagePlus size={16} /></button>
                  <button type="button" title="Share Location" aria-label="Share Location"><MapPin size={16} /></button>
                  <button
                    type="button"
                    className="tt-ai-suggestions-toggle"
                    aria-expanded={travelIdeasOpen}
                    onClick={() => setTravelIdeasOpen((value) => !value)}
                  >
                    <Sparkles size={15} />
                    <span>{travelIdeasOpen ? "Hide Suggestions" : "Show Suggestions"}</span>
                  </button>
                </div>
                <div className="tt-ai-right-tools">
                  <button type="button" className="tt-ai-model">Trace 1.0 - Pro <ChevronDown size={13} /></button>
                  <button type="button" className="tt-ai-send" onClick={() => void sendMessage()} aria-label="Send message" disabled={typing || !input.trim()}><Send size={17} /></button>
                </div>
              </div>
            </div>
          </div>

          {travelIdeasOpen ? (
            <section className="tt-ai-starter-panel" aria-label="Quick suggestions">
              <div className="tt-ai-starter-head">
                <p>Travel ideas</p>
                <span>Scroll to explore</span>
              </div>
              <div className="tt-ai-prompt-rail">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      type="button"
                      className="tt-ai-prompt-card"
                      onClick={() => void sendMessage(action.prompt)}
                      style={{ "--accent": action.accent } as React.CSSProperties}
                    >
                      <span className="tt-ai-prompt-visual" aria-hidden="true">
                        <Icon size={30} strokeWidth={1.5} />
                      </span>
                      <span className="tt-ai-prompt-copy">
                        <strong>{action.title}</strong>
                        <small>{action.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      </div>

      {toast ? <div className="tt-ai-toast">{toast}</div> : null}

      <style>{`
        .tt-ai-page {
          --sidebar-width: 16rem;
          position: fixed;
          inset: 64px 0 0;
          z-index: 40;
          height: calc(100dvh - 64px);
          min-height: 0;
          overflow: hidden;
          padding: 0;
          background: #F8F3EC;
          color: #342820;
          font-family: var(--font-ui);
        }
        .tt-ai-shell {
          width: 100%;
          height: calc(100dvh - 64px);
          min-height: 36rem;
          display: grid;
          grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
          overflow: hidden;
          background: #FBF7F0;
          transition: grid-template-columns 250ms ease;
        }
        .tt-ai-page--collapsed { --sidebar-width: 5.25rem; }
        .tt-ai-sidebar {
          position: relative;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          overflow-x: hidden;
          overflow-y: auto;
          border-right: 1px solid rgba(58, 42, 34, 0.13);
          background: #EFE7DC;
          color: #3A2A22;
          padding: 1rem 0.85rem;
          transition: left 250ms ease, transform 250ms ease;
          scrollbar-width: thin;
          scrollbar-color: rgba(58, 42, 34, 0.2) transparent;
        }
        .tt-ai-sidebar button {
          border: 0;
          color: inherit;
          cursor: pointer;
          font: inherit;
        }
        .tt-ai-sidebar-head,
        .tt-ai-brand,
        .tt-ai-new-chat,
        .tt-ai-side-section button,
        .tt-ai-recent button,
        .tt-ai-profile {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .tt-ai-sidebar-head,
        .tt-ai-new-chat,
        .tt-ai-side-section {
          flex: 0 0 auto;
        }
        .tt-ai-sidebar-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          min-height: 2.5rem;
          width: 100%;
          margin-bottom: 0.2rem;
        }
        .tt-ai-brand {
          min-width: 0;
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 600;
          color: #3A2A22;
        }
        .tt-ai-sidebar-head > button,
        .tt-ai-mobile-menu {
          display: grid;
          place-items: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.45rem;
          background: rgba(58, 42, 34, 0.08);
        }
        .tt-ai-new-chat {
          min-height: 2.55rem;
          justify-content: flex-start;
          border-radius: 0.45rem;
          background: #C4713A;
          color: #FFF9F0 !important;
          padding: 0 0.7rem;
          font-size: 0.79rem;
          font-weight: 700;
          transition: background 250ms ease;
        }
        .tt-ai-new-chat:hover { background: #A8582D; }
        .tt-ai-side-section,
        .tt-ai-recent {
          display: grid;
          gap: 0.18rem;
          border-top: 1px solid rgba(58, 42, 34, 0.12);
          padding-top: 0.65rem;
        }
        .tt-ai-side-section p,
        .tt-ai-recent p {
          margin: 0.25rem 0.55rem;
          font-family: var(--font-label);
          font-size: 0.59rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8B5037;
        }
        .tt-ai-side-section button,
        .tt-ai-recent button {
          min-height: 2.25rem;
          width: 100%;
          border-radius: 0.45rem;
          background: transparent;
          padding: 0 0.6rem;
          color: #4E3B31;
          font-size: 0.76rem;
          text-align: left;
          transition: background 250ms ease, transform 250ms ease;
        }
        .tt-ai-side-section button:hover,
        .tt-ai-recent button:hover { background: rgba(196, 113, 58, 0.12); color: #3A2A22; }
        .tt-ai-recent button span,
        .tt-ai-side-section button span,
        .tt-ai-new-chat span,
        .tt-ai-profile div {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tt-ai-brand span {
          min-width: 0;
          overflow: visible;
          white-space: nowrap;
        }
        .tt-ai-recent > span {
          color: #6A584E;
          font-size: 0.73rem;
          padding: 0.4rem 0.6rem;
        }
        .tt-ai-profile {
          margin-top: auto;
          border-top: 1px solid rgba(58, 42, 34, 0.12);
          padding: 0.8rem 0.5rem 0.15rem;
        }
        .tt-ai-profile > span {
          display: grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #C4713A;
          color: #FFF9F0;
          font-size: 0.78rem;
          font-weight: 900;
        }
        .tt-ai-profile strong {
          color: #3A2A22;
          font-size: 0.77rem;
          font-weight: 700;
        }
        .tt-ai-profile small {
          color: #6A584E;
          font-size: 0.67rem;
        }
        .tt-ai-profile strong,
        .tt-ai-profile small { display: block; }
        .tt-ai-page--collapsed .tt-ai-sidebar { align-items: center; }
        .tt-ai-page--collapsed .tt-ai-sidebar-head {
          grid-template-columns: 1fr;
          justify-items: center;
          gap: 0.4rem;
        }
        .tt-ai-page--collapsed .tt-ai-brand span,
        .tt-ai-page--collapsed .tt-ai-new-chat span,
        .tt-ai-page--collapsed .tt-ai-side-section p,
        .tt-ai-page--collapsed .tt-ai-side-section button span,
        .tt-ai-page--collapsed .tt-ai-recent,
        .tt-ai-page--collapsed .tt-ai-profile div { display: none; }
        .tt-ai-page--collapsed .tt-ai-brand,
        .tt-ai-page--collapsed .tt-ai-sidebar-head > button {
          width: 2.55rem;
          justify-content: center;
        }
        .tt-ai-page--collapsed .tt-ai-new-chat,
        .tt-ai-page--collapsed .tt-ai-side-section button {
          width: 2.55rem;
          justify-content: center;
          padding: 0;
        }
        .tt-ai-main {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          overflow: hidden;
          background: #FBFAF7;
        }
        .tt-ai-mobile-menu {
          display: none;
          position: fixed;
          left: 1rem;
          top: 0.8rem;
          z-index: 50;
          border: 0;
          color: #342820;
        }
        .tt-ai-center {
          width: min(100%, 66rem);
          height: 100%;
          min-height: 0;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-content: start;
          gap: 1rem;
          overflow-y: auto;
          padding: 1.5rem 1.5rem 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(52, 40, 32, 0.2) transparent;
        }
        .tt-ai-empty {
          width: min(100%, 58rem);
          min-height: 0;
          flex: 1 1 auto;
          display: grid;
          place-content: center;
          align-self: center;
          justify-items: center;
          gap: 0.8rem;
          margin: 0;
          padding: 1.5rem 0;
          text-align: center;
        }
        .tt-ai-empty h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 3.75rem;
          font-weight: 500;
          line-height: 1.02;
          color: #2D231D;
        }
        .tt-ai-empty span {
          max-width: 45rem;
          color: #66564C;
          font-family: var(--font-body);
          font-size: 1.05rem;
          line-height: 1.65;
        }
        .tt-ai-starter-panel {
          width: 100%;
          min-width: 0;
          order: 9;
          align-self: start;
          overflow: hidden;
        }
        .tt-ai-starter-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .tt-ai-starter-head p {
          margin: 0;
          font-family: var(--font-label);
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9A573A;
        }
        .tt-ai-starter-head > span {
          color: #74645A;
          font-size: 0.66rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .tt-ai-prompt-rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc((100% - 2.6rem) / 5);
          gap: 0.65rem;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: x mandatory;
          padding: 0 0 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(58, 42, 34, 0.18) transparent;
        }
        .tt-ai-prompt-card {
          min-width: 0;
          display: grid;
          grid-template-rows: 6rem auto;
          overflow: hidden;
          border: 1px solid rgba(58, 42, 34, 0.12);
          border-radius: 0.55rem;
          background: #FFFDF9;
          color: #342820;
          padding: 0;
          cursor: pointer;
          text-align: left;
          scroll-snap-align: start;
          transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
        }
        .tt-ai-prompt-card:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--accent), #3A2A22 28%);
          box-shadow: 0 1rem 2.2rem rgba(58, 42, 34, 0.12);
        }
        .tt-ai-prompt-visual {
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: color-mix(in srgb, var(--accent), #F3EDE4 72%);
          color: color-mix(in srgb, var(--accent), #3A2A22 25%);
        }
        .tt-ai-prompt-visual::before,
        .tt-ai-prompt-visual::after {
          position: absolute;
          content: "";
          border: 1px solid currentColor;
          opacity: 0.2;
        }
        .tt-ai-prompt-visual::before { width: 58%; height: 72%; transform: rotate(7deg); }
        .tt-ai-prompt-visual::after { width: 38%; height: 52%; transform: rotate(-8deg); }
        .tt-ai-prompt-visual svg { position: relative; z-index: 1; }
        .tt-ai-prompt-copy {
          min-width: 0;
          display: grid;
          gap: 0.3rem;
          padding: 0.65rem;
        }
        .tt-ai-prompt-copy strong {
          display: block;
          color: #342820;
          font-family: var(--font-display);
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.12;
        }
        .tt-ai-prompt-copy small {
          display: -webkit-box;
          overflow: hidden;
          color: #6A584E;
          font-size: 0.62rem;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .tt-ai-composer-wrap {
          width: 100%;
          align-self: end;
          justify-self: start;
          order: 10;
          position: sticky;
          bottom: 0;
          z-index: 30;
          margin-top: auto;
          border-top: 1px solid rgba(58, 42, 34, 0.12);
          background: #FBFAF7;
          padding: 0.75rem 0 1rem;
        }
        .tt-ai-composer {
          border: 1.5px solid rgba(52, 40, 32, 0.16);
          border-radius: 0.8rem;
          background: #FFFFFF;
          padding: 0.7rem;
          box-shadow: 0 1rem 2.5rem rgba(52, 40, 32, 0.11);
          transition: border-color 250ms ease, box-shadow 250ms ease;
        }
        .tt-ai-composer:focus-within {
          border-color: rgba(201, 111, 74, 0.58);
          box-shadow: 0 1rem 2.5rem rgba(52, 40, 32, 0.13);
        }
        .tt-ai-composer textarea {
          width: 100%;
          min-height: 3.25rem;
          max-height: 9rem;
          resize: none;
          border: 0;
          background: transparent;
          outline: none;
          color: #2D231D;
          font: inherit;
          font-size: 0.88rem;
          line-height: 1.55;
          padding: 0.2rem 0.25rem 0.4rem;
        }
        .tt-ai-composer textarea::placeholder { color: #958980; }
        .tt-ai-composer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .tt-ai-left-tools,
        .tt-ai-right-tools { display: flex; align-items: center; gap: 0.25rem; }
        .tt-ai-left-tools button,
        .tt-ai-model,
        .tt-ai-send {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          border: 0;
          border-radius: 0.45rem;
          background: transparent;
          color: #5F5148;
          padding: 0 0.55rem;
          cursor: pointer;
          transition: background 250ms ease, transform 250ms ease;
        }
        .tt-ai-left-tools button:hover,
        .tt-ai-model:hover { background: #F1EBE2; }
        .tt-ai-suggestions-toggle {
          gap: 0.38rem;
          white-space: nowrap;
          color: #7A432D !important;
        }
        .tt-ai-suggestions-toggle[aria-expanded="true"] {
          background: rgba(196, 113, 58, 0.13);
        }
        .tt-ai-model { font-size: 0.68rem; font-weight: 800; }
        .tt-ai-send {
          width: 2rem;
          padding: 0;
          border-radius: 50%;
          background: #273039;
          color: #FFFFFF;
        }
        .tt-ai-send:not(:disabled):hover { transform: translateY(-1px); background: #C96F4A; }
        .tt-ai-send:disabled { opacity: 0.45; cursor: not-allowed; }
        .tt-ai-messages {
          width: 100%;
          flex: 1 1 auto;
          justify-self: start;
          display: grid;
          align-content: start;
          gap: 1.2rem;
          overflow-y: visible;
          padding: 0.15rem 0.2rem;
          scroll-behavior: smooth;
        }
        .tt-ai-message {
          max-width: min(100%, 46rem);
          display: grid;
          gap: 0.42rem;
          animation: tt-ai-fade 250ms ease both;
        }
        .tt-ai-message--user { justify-self: end; }
        .tt-ai-message--assistant { justify-self: start; }
        .tt-ai-message-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #74645A;
          font-size: 0.68rem;
        }
        .tt-ai-message--user .tt-ai-message-meta { justify-content: flex-end; }
        .tt-ai-message-card {
          border-radius: 0.65rem;
          padding: 0.9rem 1rem;
        }
        .tt-ai-message--user .tt-ai-message-card {
          border-bottom-right-radius: 0.15rem;
          background: #C96F4A;
          color: #fff;
        }
        .tt-ai-message--assistant .tt-ai-message-card {
          border: 1px solid rgba(52, 40, 32, 0.1);
          border-bottom-left-radius: 0.15rem;
          background: #FFFFFF;
          color: #342820;
        }
        .tt-ai-message-card p,
        .tt-ai-markdown p { margin: 0; line-height: 1.65; }
        .tt-ai-markdown { display: grid; gap: 0.7rem; }
        .tt-ai-message-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .tt-ai-message--user .tt-ai-message-actions { justify-content: flex-end; }
        .tt-ai-message-actions button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          min-height: 1.8rem;
          border: 0;
          border-radius: 0.35rem;
          background: transparent;
          color: #66564C;
          padding: 0 0.45rem;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
        }
        .tt-ai-message-actions button:hover { background: #EEE7DE; }
        .tt-ai-typing {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          width: fit-content;
          border-radius: 0.5rem;
          background: #FFFFFF;
          color: #74645A;
          padding: 0.6rem 0.8rem;
          box-shadow: 0 0.6rem 1.6rem rgba(52, 40, 32, 0.08);
        }
        .tt-ai-typing span {
          display: grid;
          place-items: center;
          width: 1.7rem;
          height: 1.7rem;
          border-radius: 50%;
          background: #F1E2D8;
          color: #C96F4A;
          animation: tt-ai-route 1.2s ease-in-out infinite;
        }
        .tt-ai-toast {
          position: fixed;
          right: 1rem;
          bottom: 1rem;
          z-index: 1100;
          border-radius: 0.5rem;
          background: #273039;
          color: #FFFFFF;
          padding: 0.75rem 1rem;
          box-shadow: 0 1.1rem 2.75rem rgba(18, 33, 46, 0.2);
          font-weight: 800;
        }
        .tt-ai-overlay { display: none; }
        @keyframes tt-ai-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tt-ai-route {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(7px); }
        }
        @media (max-width: 980px) {
          .tt-ai-page { padding: 0; background: #FBFAF7; }
          .tt-ai-shell {
            height: calc(100dvh - 64px);
            min-height: 0;
            display: block;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }
          .tt-ai-sidebar {
            position: fixed;
            z-index: 100;
            left: -100%;
            top: 64px;
            bottom: 0;
            width: min(19rem, 86vw);
            transform: none;
            box-shadow: 1.5rem 0 3.75rem rgba(18, 33, 46, 0.24);
          }
          .tt-ai-sidebar--open { left: 0; }
          .tt-ai-mobile-menu { display: grid; }
          .tt-ai-main { height: 100%; }
          .tt-ai-center { padding-top: 4rem; }
          .tt-ai-overlay {
            display: block;
            position: fixed;
            inset: 64px 0 0;
            z-index: 90;
            border: 0;
            background: rgba(18, 33, 46, 0.35);
          }
          .tt-ai-page--collapsed .tt-ai-brand span,
          .tt-ai-page--collapsed .tt-ai-new-chat span,
          .tt-ai-page--collapsed .tt-ai-side-section p,
          .tt-ai-page--collapsed .tt-ai-side-section button span,
          .tt-ai-page--collapsed .tt-ai-profile div { display: block; }
          .tt-ai-page--collapsed .tt-ai-recent { display: grid; }
          .tt-ai-page--collapsed .tt-ai-new-chat,
          .tt-ai-page--collapsed .tt-ai-side-section button { width: 100%; justify-content: flex-start; padding: 0 0.65rem; }
        }
        @media (max-width: 700px) {
          .tt-ai-center { gap: 1rem; padding: 4rem 0.85rem 0; }
          .tt-ai-empty { padding: 1rem 0; }
          .tt-ai-empty h2 { font-size: 2.2rem; }
          .tt-ai-empty span { max-width: 22rem; font-size: 0.9rem; }
          .tt-ai-composer-row { flex-wrap: wrap; gap: 0.45rem; }
          .tt-ai-right-tools { margin-left: auto; }
          .tt-ai-prompt-rail {
            grid-auto-columns: minmax(10rem, 76%);
            overflow-x: auto;
            padding-bottom: 0.35rem;
            scrollbar-width: none;
          }
          .tt-ai-prompt-rail::-webkit-scrollbar { display: none; }
          .tt-ai-composer-wrap {
            position: sticky;
            bottom: 0;
            z-index: 30;
            background: #FBFAF7;
            padding-bottom: 0.75rem;
          }
          .tt-ai-model { max-width: 8.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .tt-ai-message-actions { overflow-x: auto; flex-wrap: nowrap; }
          .tt-ai-message-actions button { flex: 0 0 auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tt-ai-page *, .tt-ai-page *::before, .tt-ai-page *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </section>
  );
}
