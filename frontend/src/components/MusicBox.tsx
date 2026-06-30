import { useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";

const TRACK_URL = "/music/Mangrove%20Map%20Drift.mp3";
let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio(TRACK_URL);
    sharedAudio.loop = true;
    sharedAudio.preload = "metadata";
    sharedAudio.volume = 0.32;
  }
  return sharedAudio;
}

export function MusicBox({ variant = "floating" }: { variant?: "floating" | "menu" }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = getSharedAudio();
    audioRef.current = audio;
    setPlaying(!audio.paused);
    setReady(audio.readyState >= HTMLMediaElement.HAVE_METADATA);

    const handleCanPlay = () => setReady(true);
    const handlePause = () => setPlaying(false);
    const handlePlay = () => setPlaying(true);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
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
          ? "flex w-full items-center gap-2 border-t border-[#2D4A2D]/10 px-4 py-3 text-left text-sm text-[#1A1A1A] transition hover:bg-[#F5F0E8]"
          : `group flex min-h-11 items-center gap-2 rounded-full border px-3 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] shadow-[0_12px_30px_rgba(27,37,38,0.18)] backdrop-blur transition ${
              playing
                ? "border-[#C4713A]/45 bg-[#C4713A] text-[#F5F0E8]"
                : "border-[#2D4A2D]/15 bg-[#F5F0E8]/92 text-[#2D4A2D] hover:bg-[#EDEAE0]"
            }`
      }
      aria-pressed={playing}
      aria-label={playing ? "Turn music off" : "Turn music on"}
      title={ready ? "Mangrove Map Drift" : "Music loading"}
    >
      <Music2 size={variant === "menu" ? 15 : 16} className={playing ? "animate-musicPulse" : ""} />
      <span className={variant === "menu" ? "flex-1" : "hidden sm:inline"}>{playing ? "Music On" : "Music Off"}</span>
      {playing ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
  );

  if (variant === "menu") return button;

  return <div className="fixed right-4 top-20 z-[90] sm:right-6">{button}</div>;
}
