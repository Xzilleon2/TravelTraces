import { useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";

const TRACKS = [
  { title: "Mangrove Map Drift", url: "/music/Mangrove%20Map%20Drift.mp3" },
  { title: "Open Coastline", url: "/music/Open%20Coastline%20(Beach%20Vibe).mp3" },
  { title: "Trail View", url: "/music/Trail%20View%20(Hiking%20Vibe).mp3" },
];

let sharedAudio: HTMLAudioElement | null = null;
let sharedTrackIndex = 0;

function emitTrackChange() {
  window.dispatchEvent(new CustomEvent("traveltraces:music-track-change", { detail: { index: sharedTrackIndex } }));
}

function loadTrack(index: number, keepPlaying: boolean) {
  const audio = getSharedAudio();
  sharedTrackIndex = (index + TRACKS.length) % TRACKS.length;
  audio.src = TRACKS[sharedTrackIndex].url;
  audio.load();
  emitTrackChange();
  if (keepPlaying) {
    void audio.play().catch(() => undefined);
  }
}

function getSharedAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio(TRACKS[sharedTrackIndex].url);
    sharedAudio.loop = false;
    sharedAudio.preload = "metadata";
    sharedAudio.volume = 0.32;
    sharedAudio.addEventListener("ended", () => loadTrack(sharedTrackIndex + 1, true));
  }
  return sharedAudio;
}

export function MusicBox({ variant = "floating" }: { variant?: "floating" | "menu" }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [trackIndex, setTrackIndex] = useState(sharedTrackIndex);

  useEffect(() => {
    const audio = getSharedAudio();
    audioRef.current = audio;
    setPlaying(!audio.paused);
    setReady(audio.readyState >= HTMLMediaElement.HAVE_METADATA);
    setTrackIndex(sharedTrackIndex);

    const handleCanPlay = () => setReady(true);
    const handlePause = () => setPlaying(false);
    const handlePlay = () => setPlaying(true);
    const handleTrackChange = (event: Event) => {
      const detail = (event as CustomEvent<{ index: number }>).detail;
      setTrackIndex(detail?.index ?? sharedTrackIndex);
      setReady(false);
    };
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    window.addEventListener("traveltraces:music-track-change", handleTrackChange);
    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      window.removeEventListener("traveltraces:music-track-change", handleTrackChange);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current ?? getSharedAudio();
    if (playing) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={() => void toggle()}
      className={
        variant === "menu"
          ? "flex w-full items-center gap-2 border-t border-[#3A2A22]/10 px-4 py-3 text-left text-sm text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
          : `group flex min-h-11 items-center gap-2 rounded-full border px-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] shadow-[0_12px_30px_rgba(27,37,38,0.18)] backdrop-blur transition ${
              playing
                ? "border-[#C4713A]/45 bg-[#C4713A] text-[#F5F0E8]"
                : "border-[#3A2A22]/15 bg-[#F5F0E8]/92 text-[#3A2A22] hover:bg-[#EDEAE0]"
            }`
      }
      aria-pressed={playing}
      aria-label={playing ? "Turn music off" : "Turn music on"}
      title={ready ? TRACKS[trackIndex].title : "Music loading"}
    >
      <Music2 size={variant === "menu" ? 15 : 16} className={playing ? "animate-musicPulse" : ""} />
      <span className={variant === "menu" ? "flex-1" : "hidden sm:inline"}>{playing ? TRACKS[trackIndex].title : "Music Off"}</span>
      {playing ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
  );

  if (variant === "menu") return button;

  return <div className="fixed right-4 top-20 z-[90] sm:right-6">{button}</div>;
}
