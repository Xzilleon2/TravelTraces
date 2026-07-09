import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  X,
  Check,
  Upload,
} from "lucide-react";
import { sanitizeRichHtml } from "../security/sanitize";

interface MapCustomFormProps {
  x: number;
  y: number;
  region: string;
  onSave: (data: {
    name: string;
    category: string;
    note: string;
    type: "visited" | "wishlist";
    isBold: boolean;
    isItalic: boolean;
    isQuote: boolean;
    align: "left" | "center" | "right";
    isBullet: boolean;
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
}

const CATEGORIES = ["Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];

export function MapCustomForm({ x, y, region, onSave, onCancel }: MapCustomFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Hiking");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"visited" | "wishlist">("visited");

  // Master toggles (used for fallback or general card state metadata)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [isBullet, setIsBullet] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [activeImageTab, setActiveImageTab] = useState<"upload" | "url">("upload");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force placeholder check
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = sanitizeRichHtml(editorRef.current.innerHTML);
      const text = editorRef.current.innerText || "";
      setNote(html);
      setIsEditorEmpty(!text.trim());
    }
  };

  const executeFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  // Convert files locally to base64 data strings for mock durability
  const handleLocalImage = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImageUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLocalImage(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalNote = sanitizeRichHtml(
      note.trim() ||
        (editorRef.current ? editorRef.current.innerHTML : "") ||
        "",
    );

    onSave({
      name: title.trim(),
      category,
      note: finalNote,
      type,
      isBold,
      isItalic,
      isQuote,
      align,
      isBullet,
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        backgroundColor: "rgba(26,26,26,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#F5F0E8",
          borderRadius: "0.5rem",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "95vh",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
        }}
        className="form-grid-layout"
      >
        {/* LEFT COLUMN: Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.5rem",
            borderRight: "1px solid rgba(58,42,34,0.1)",
            overflowY: "auto",
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E6B5C", fontWeight: 700 }}>
                Interactive Story Sandbox
              </span>
              <button
                type="button"
                onClick={onCancel}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B5A" }}
              >
                <X size={18} />
              </button>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>
              Pin Details ({Math.round(x)}%, {Math.round(y)}%)
            </h3>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A", margin: "0.1rem 0 0" }}>
              In {region}
            </p>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Story Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Whispers of Calle Crisologo"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                backgroundColor: "#EDEAE0",
                border: "1px solid rgba(58,42,34,0.15)",
                borderRadius: "0.25rem",
                fontSize: "0.85rem",
                color: "#1A1A1A",
                fontFamily: "var(--font-ui)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category / Pin Type Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
                Travel Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#EDEAE0",
                  border: "1px solid rgba(58,42,34,0.15)",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem",
                  color: "#1A1A1A",
                  fontFamily: "var(--font-ui)",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
                Map Pin Type
              </label>
              <div style={{ display: "flex", gap: "0.3rem", height: "34px" }}>
                <button
                  type="button"
                  onClick={() => setType("visited")}
                  style={{
                    flex: 1,
                    backgroundColor: type === "visited" ? "#3A2A22" : "transparent",
                    color: type === "visited" ? "#F5F0E8" : "#3A2A22",
                    border: "1px solid",
                    borderColor: type === "visited" ? "#3A2A22" : "rgba(58,42,34,0.2)",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-label)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Visited
                </button>
                <button
                  type="button"
                  onClick={() => setType("wishlist")}
                  style={{
                    flex: 1,
                    backgroundColor: type === "wishlist" ? "#C4713A" : "transparent",
                    color: type === "wishlist" ? "#F5F0E8" : "#C4713A",
                    border: "1px solid",
                    borderColor: type === "wishlist" ? "#C4713A" : "rgba(196,113,58,0.2)",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-label)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Wishlist
                </button>
              </div>
            </div>
          </div>

          {/* PICTURE SELECTION MODULE */}
          <div style={{ border: "1px solid rgba(58,42,34,0.12)", borderRadius: "0.25rem", backgroundColor: "#EDEAE0", padding: "0.75rem" }}>
            <span style={{ display: "block", marginBottom: "0.35rem", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
              Story Hero Image
            </span>

            {/* Selector tab buttons */}
            <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
              {(["upload", "url"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveImageTab(tab)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-label)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    borderRadius: "0.15rem",
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: activeImageTab === tab ? "#3A2A22" : "rgba(58,42,34,0.15)",
                    backgroundColor: activeImageTab === tab ? "#3A2A22" : "transparent",
                    color: activeImageTab === tab ? "#F5F0E8" : "#3A2A22"
                  }}
                >
                  {tab === "upload" ? "Upload Photo" : "Web URL"}
                </button>
              ))}
            </div>

            {/* Offline File drag and drop */}
            {activeImageTab === "upload" && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1.5px dashed ${dragActive ? "#C4713A" : "rgba(58,42,34,0.25)"}`,
                  borderRadius: "0.25rem",
                  padding: "0.75rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: dragActive ? "rgba(196,113,58,0.06)" : "transparent",
                  transition: "all 0.1s"
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleLocalImage(e.target.files[0])}
                />
                <Upload size={18} color="#C4713A" style={{ margin: "0 auto 0.25rem" }} />
                <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A" }}>
                  Drag & drop travel snapshot or <strong>browse files</strong>
                </p>
              </div>
            )}

            {/* Manual web Image URL link paste */}
            {activeImageTab === "url" && (
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <input
                  type="text"
                  placeholder="Paste direct travel picture URL (https://...)"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.4rem 0.6rem",
                    backgroundColor: "#F5F0E8",
                    border: "1px solid rgba(58,42,34,0.15)",
                    borderRadius: "0.15rem",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-ui)",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim().startsWith("http")) {
                      setImageUrl(customUrlInput.trim());
                    }
                  }}
                  style={{
                    padding: "0.4rem 0.75rem",
                    backgroundColor: "#3A2A22",
                    color: "#F5F0E8",
                    border: "none",
                    borderRadius: "0.15rem",
                    fontFamily: "var(--font-label)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* DESCRIPTION STORY WITH SELECTION WYSIWYG EDITOR */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B6B5A" }}>
                Description / Story * (Highlight text to format specific words)
              </label>
              <span style={{ fontSize: "0.65rem", color: "#C4713A", fontWeight: 700, fontFamily: "var(--font-label)" }}>EXPERT SELECTION FORMATTING MODE</span>
            </div>

            {/* Wysiwyg Action Formatter Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.3rem",
                backgroundColor: "#E5E1D4",
                borderRadius: "0.25rem 0.25rem 0 0",
                border: "1px solid rgba(58,42,34,0.15)",
                borderBottom: "none",
                flexWrap: "wrap",
              }}
            >
              {/* Bold Specific Words */}
              <button
                type="button"
                onClick={() => executeFormat("bold")}
                title="Format Selection Bold"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Bold size={13} style={{ fontWeight: "bold" }} />
              </button>

              {/* Italicize Specific Words */}
              <button
                type="button"
                onClick={() => executeFormat("italic")}
                title="Format Selection Italic"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Italic size={13} />
              </button>

              {/* Specific Quotes Block */}
              <button
                type="button"
                onClick={() => executeFormat("formatBlock", "<blockquote>")}
                title="Format Selection as Blockquote"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Quote size={13} />
              </button>

              <div style={{ width: 1, height: 16, backgroundColor: "rgba(58,42,34,0.15)", margin: "0 0.15rem" }} />

              {/* Justify / Align Selection Left */}
              <button
                type="button"
                onClick={() => executeFormat("justifyLeft")}
                title="Justify Selection Left"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <AlignLeft size={13} />
              </button>

              {/* Justify / Align Selection Center */}
              <button
                type="button"
                onClick={() => executeFormat("justifyCenter")}
                title="Justify Selection Center"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <AlignCenter size={13} />
              </button>

              {/* Justify / Align Selection Right */}
              <button
                type="button"
                onClick={() => executeFormat("justifyRight")}
                title="Justify Selection Right"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <AlignRight size={13} />
              </button>

              <div style={{ width: 1, height: 16, backgroundColor: "rgba(58,42,34,0.15)", margin: "0 0.15rem" }} />

              {/* List bulleting selection */}
              <button
                type="button"
                onClick={() => executeFormat("insertUnorderedList")}
                title="Format Selection/Line as Bullet List"
                style={{
                  padding: "0.35rem",
                  borderRadius: "0.2rem",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#3A2A22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(58,42,34,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <List size={13} />
              </button>
            </div>

            {/* EXPERT WYSIWYG rich contentEditable board */}
            <div style={{ position: "relative" }}>
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleEditorInput}
                style={{
                  width: "100%",
                  minHeight: "130px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  padding: "0.75rem",
                  backgroundColor: "#EDEAE0",
                  border: "1px solid rgba(58,42,34,0.15)",
                  borderRadius: "0 0 0.25rem 0.25rem",
                  fontSize: "0.85rem",
                  color: "#1A1A1A",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
                className="rich-editor"
              />
              {isEditorEmpty && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    left: "0.75rem",
                    color: "#6B6B5A",
                    opacity: 0.6,
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    pointerEvents: "none",
                    lineHeight: 1.5
                  }}
                >
                  Type your diary story here. Highlight words to make them Bold, Italicized, Centered, Right-Justified, Bulleted, or Quote-styled!
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.25rem" }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "0.5rem",
                backgroundColor: "transparent",
                color: "#6B6B5A",
                border: "1px solid rgba(58,42,34,0.2)",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontFamily: "var(--font-label)",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 650,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                flex: 2,
                padding: "0.5rem",
                backgroundColor: title.trim() ? "#3A2A22" : "#D8D4C8",
                color: "#F5F0E8",
                border: "none",
                borderRadius: "0.25rem",
                cursor: title.trim() ? "pointer" : "not-allowed",
                fontFamily: "var(--font-label)",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <Check size={14} /> Publish Rich Story
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Real-Time Live Preview Story Card */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#EDEAE0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box"
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: "0.625rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", fontWeight: 700 }}>
              Live Map Story Card Preview
            </p>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 600, color: "#3A2A22", marginTop: "0.15rem", marginBottom: 0 }}>
              Beholds custom selections immediately
            </h4>
          </div>

          <div
            style={{
              backgroundColor: "#F5F0E8",
              borderRadius: "0.25rem",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(58,42,34,0.08)",
              border: "1px solid rgba(58,42,34,0.06)",
              display: "flex",
              flexDirection: "column",
              minHeight: "340px",
            }}
          >
            {/* Embedded Selected photo background */}
            <div
              style={{
                height: "130px",
                position: "relative",
                backgroundColor: "#3A2A22",
                color: "#F5F0E8",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Selected story background"
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85, position: "absolute", inset: 0 }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(135deg, #3A2A22 0%, #7A4B32 100%)",
                    color: "#FBF7F0",
                    fontFamily: "var(--font-label)",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Add Photo
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)" }} />

              <div style={{ position: "relative", padding: "0.75rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    style={{
                      backgroundColor: "#C4713A",
                      color: "#F5F0E8",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "2px",
                      fontSize: "0.55rem",
                      fontFamily: "var(--font-label)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {category}
                  </span>

                  <span
                    style={{
                      backgroundColor: "rgba(245,240,232,0.25)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "1rem",
                      fontSize: "0.55rem",
                      fontFamily: "var(--font-ui)",
                      textTransform: "capitalize",
                      fontWeight: "bold",
                      border: "0.5px solid rgba(255,255,255,0.3)"
                    }}
                  >
                    My Pin ({type})
                  </span>
                </div>

                <div>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "rgba(245,240,232,0.9)", margin: 0, fontWeight: 500 }}>
                    {region}
                  </p>
                  <h5 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "#F5F0E8", margin: "0.1s 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {title || "Untitled Masterpiece"}
                  </h5>
                </div>
              </div>
            </div>

            {/* live word formatting renderer wrapper */}
            <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "150px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.82rem",
                    lineHeight: 1.5,
                    color: "#1A1A1A",
                    margin: 0,
                    outline: "none"
                  }}
                  className="preview-rendered-body"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichHtml(
                      note.trim() ||
                        "<p>Highlight words above inside the input panel to see customized bolding, lists, alignments and quotes reflect here live!</p>",
                    )
                  }}
                />
              </div>

              {/* Author signature stamp footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  borderTop: "1px solid rgba(58,42,34,0.08)",
                  paddingTop: "0.6rem",
                  marginTop: "0.6rem",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "#3A2A22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-label)",
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    color: "#F5F0E8",
                  }}
                >
                  Y
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                    You (Archipelago Explorer)
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.55rem", color: "#6B6B5A", margin: 0 }}>
                    Published Just Now • Custom styled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .form-grid-layout {
            grid-template-columns: 1fr !important;
            max-height: 98vh;
            overflow-y: auto;
          }
          .form-grid-layout > div {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
