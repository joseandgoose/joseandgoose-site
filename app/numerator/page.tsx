"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// --- Colors ---
const C = {
  accent: "#F3D104",
  success: "#0e8d5c",
  text: "#f5f5f7",
  dark: "#0a0a0f",
  red: "#ff3355",
};

// --- API helpers ---
async function apiGetState(): Promise<{
  active_count: number;
  total_guesses: number;
}> {
  const res = await fetch("/api/state");
  return res.json();
}

async function apiSubmitGuess(guess: number): Promise<{
  status: "waiting" | "active";
  correct_answer?: number;
  count?: number;
  active_count?: number;
  total_guesses: number;
}> {
  const res = await fetch("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess }),
  });
  return res.json();
}

// --- Share Card Component ---
function ShareCard({
  rounds,
  lastResult,
  percentAway,
  totalGuesses,
  onClose,
}: {
  rounds: number;
  lastResult: string;
  percentAway: number;
  totalGuesses: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = 540;
    const h = 680;
    canvas.width = w;
    canvas.height = h;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0a0f");
    bg.addColorStop(0.5, "#0f0f1a");
    bg.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.015)";
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 15;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(243,209,4,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.textAlign = "center";
    ctx.fillStyle = C.accent;
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 20;
    ctx.font = "bold 52px 'Courier New', monospace";
    ctx.fillText("NUMERATOR", w / 2, 110);
    ctx.shadowBlur = 0;

    const lineGrad = ctx.createLinearGradient(60, 0, w - 60, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.3, C.accent);
    lineGrad.addColorStop(0.7, C.accent);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.lineTo(w - 60, 140);
    ctx.stroke();

    const isWin = lastResult === "WIN";
    const isPerfect = lastResult === "PERFECT";
    const isClose = lastResult === "CLOSE";

    ctx.font = "72px serif";
    ctx.fillText(
      isWin ? "👑" : isPerfect ? "✨" : isClose ? "🔥" : "💀",
      w / 2,
      230
    );

    ctx.fillStyle = isWin
      ? C.accent
      : isPerfect
      ? C.success
      : isClose
      ? C.accent
      : C.red;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText(
      isWin
        ? "LEGENDARY!"
        : isPerfect
        ? "NAILED IT"
        : isClose
        ? "SO CLOSE"
        : "GAME OVER",
      w / 2,
      300
    );
    ctx.shadowBlur = 0;

    // 3-column stat boxes
    const boxY = 340;
    const boxH = 100;
    const boxW = 140;
    const boxGap = 16;
    const totalBoxW = boxW * 3 + boxGap * 2;
    const boxStartX = (w - totalBoxW) / 2;

    ctx.fillStyle = "rgba(243,209,4,0.06)";
    ctx.strokeStyle = "rgba(243,209,4,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxStartX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(245,245,247,0.85)";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("ROUNDS", boxStartX + boxW / 2, boxY + 30);
    ctx.fillStyle = C.text;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText(String(rounds), boxStartX + boxW / 2, boxY + 74);

    ctx.fillStyle = "rgba(243,209,4,0.06)";
    ctx.beginPath();
    ctx.roundRect(boxStartX + boxW + boxGap, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(245,245,247,0.85)";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(
      "ACCURACY",
      boxStartX + boxW + boxGap + boxW / 2,
      boxY + 30
    );
    ctx.fillStyle = percentAway === 0 ? C.success : C.text;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText(
      percentAway === 0 ? "100%" : `${Math.max(0, 100 - percentAway)}%`,
      boxStartX + boxW + boxGap + boxW / 2,
      boxY + 74
    );

    ctx.fillStyle = "rgba(243,209,4,0.06)";
    ctx.beginPath();
    ctx.roundRect(
      boxStartX + (boxW + boxGap) * 2,
      boxY,
      boxW,
      boxH,
      8
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(245,245,247,0.85)";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(
      "PLAYERS",
      boxStartX + (boxW + boxGap) * 2 + boxW / 2,
      boxY + 30
    );
    ctx.fillStyle = C.text;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText(
      String(totalGuesses),
      boxStartX + (boxW + boxGap) * 2 + boxW / 2,
      boxY + 74
    );

    // Guess grid
    const gridY = 510;
    ctx.fillStyle = "rgba(245,245,247,0.6)";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillText("YOUR GUESSES", w / 2, gridY);

    const blocks: string[] = [];
    for (let i = 0; i < Math.min(rounds, 10); i++) {
      if (isWin && i < 3) {
        blocks.push(C.success);
      } else if (i < rounds - 1) {
        blocks.push(isClose ? C.accent : "rgba(245,245,247,0.35)");
      } else {
        blocks.push(
          percentAway === 0
            ? C.success
            : percentAway <= 5
            ? C.accent
            : percentAway <= 10
            ? C.accent
            : C.red
        );
      }
    }
    const blockSize = 36;
    const gap = 8;
    const totalW = blocks.length * (blockSize + gap) - gap;
    const startX = (w - totalW) / 2;

    blocks.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(
        startX + i * (blockSize + gap),
        gridY + 16,
        blockSize,
        blockSize,
        4
      );
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(245,245,247,0.25)";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(
      "Can you crack the number? Play NUMERATOR",
      w / 2,
      h - 45
    );
  }, [rounds, lastResult, percentAway, totalGuesses]);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (!blob) return;
      if (
        navigator.share &&
        navigator.canShare?.({
          files: [
            new File([blob], "numerator.png", { type: "image/png" }),
          ],
        })
      ) {
        await navigator.share({
          files: [
            new File([blob], "numerator.png", { type: "image/png" }),
          ],
          title: "Numerator",
          text: "Can you crack the number?",
        });
      } else {
        const link = document.createElement("a");
        link.download = "numerator-result.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(8px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "90vw", maxHeight: "70vh", borderRadius: 12 }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={handleShare}
          style={{
            padding: "12px 28px",
            background: C.accent,
            border: "none",
            borderRadius: 8,
            color: "#0a0a0f",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          {copied ? "SAVED!" : "SHARE / SAVE"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "12px 28px",
            background: "transparent",
            border: "2px solid rgba(245,245,247,0.3)",
            borderRadius: 8,
            color: C.text,
            fontFamily: "'Courier New', monospace",
            fontSize: 16,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// --- Flywheel Animation ---
function Flywheel({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [displayNum, setDisplayNum] = useState(50);

  useEffect(() => {
    const start = Date.now();
    const duration = 2500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      setDisplayNum(Math.floor(Math.random() * 100));
      if (p >= 1) {
        clearInterval(interval);
        setTimeout(onComplete, 100);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        gap: 24,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "3px solid rgba(243,209,4,0.2)",
          borderTopColor: C.accent,
          animation: "spin 0.6s linear infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 30px rgba(243,209,4,0.3)",
        }}
      >
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 36,
            fontWeight: "bold",
            color: C.accent,
          }}
        >
          {displayNum}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          color: "rgba(245,245,247,0.65)",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        Calculating...
      </div>
      <div
        style={{
          width: 200,
          height: 4,
          background: "rgba(243,209,4,0.15)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: C.accent,
            borderRadius: 2,
            transition: "width 0.05s linear",
            boxShadow: "0 0 10px rgba(243,209,4,0.5)",
          }}
        />
      </div>
    </div>
  );
}

// --- Arcade Game Over Screen ---
function GameOverScreen({
  rounds,
  percentAway,
  message,
  onReplay,
  onShare,
}: {
  rounds: number;
  percentAway: number;
  message: string;
  onReplay: () => void;
  onShare: () => void;
}) {
  const [showInsert, setShowInsert] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowInsert(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        gap: 16,
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 56,
          fontWeight: "bold",
          color: C.red,
          letterSpacing: 4,
          textShadow:
            "0 0 20px rgba(255,51,85,0.5), 0 0 40px rgba(255,51,85,0.3)",
          animation: "glitch 0.3s ease-in-out",
        }}
      >
        GAME OVER
      </div>
      {message && (
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 15,
            color: "rgba(245,245,247,0.85)",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 360,
            marginTop: 4,
          }}
        >
          {message}
        </div>
      )}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          color: "rgba(245,245,247,0.65)",
          letterSpacing: 2,
          marginTop: 4,
        }}
      >
        ROUNDS: {rounds} &nbsp;|&nbsp; ACCURACY:{" "}
        {Math.max(0, 100 - percentAway)}%
      </div>
      <div style={{ height: 40 }}>
        {showInsert && (
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 16,
              color: C.accent,
              letterSpacing: 3,
              animation: "blink 1s step-end infinite",
            }}
          >
            INSERT COIN TO CONTINUE
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={onReplay}
          style={{
            padding: "14px 32px",
            background: C.accent,
            border: "none",
            borderRadius: 8,
            color: "#0a0a0f",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            letterSpacing: 2,
            boxShadow: "0 0 20px rgba(243,209,4,0.4)",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1)";
          }}
        >
          ▶ PLAY AGAIN
        </button>
        <button
          onClick={onShare}
          style={{
            padding: "14px 32px",
            background: "transparent",
            border: "2px solid rgba(243,209,4,0.5)",
            borderRadius: 8,
            color: C.accent,
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          SHARE
        </button>
      </div>
    </div>
  );
}

// --- Legendary Win Screen ---
function WinScreen({
  onReplay,
  onShare,
}: {
  onReplay: () => void;
  onShare: () => void;
}) {
  const [sparkles, setSparkles] = useState<
    { left: number; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    const s = [];
    for (let i = 0; i < 24; i++) {
      s.push({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 2,
        size: 4 + Math.random() * 8,
      });
    }
    setSparkles(s);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 450,
        gap: 16,
        animation: "fadeIn 0.5s ease-out",
        position: "relative",
      }}
    >
      {sparkles.map((sp, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${sp.left}%`,
            top: -20,
            width: sp.size,
            height: sp.size,
            borderRadius: "50%",
            background: C.accent,
            opacity: 0.8,
            animation: `sparkleFall ${sp.duration}s ${sp.delay}s ease-in infinite`,
            boxShadow: `0 0 ${sp.size * 2}px ${C.accent}`,
            pointerEvents: "none",
          }}
        />
      ))}

      <div
        style={{
          fontSize: 80,
          animation: "bounceIn 0.6s ease-out",
          filter: "drop-shadow(0 0 30px rgba(243,209,4,0.6))",
        }}
      >
        👑
      </div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 44,
          fontWeight: "bold",
          color: C.accent,
          letterSpacing: 6,
          textShadow:
            "0 0 30px rgba(243,209,4,0.6), 0 0 60px rgba(243,209,4,0.3)",
          animation: "legendaryPulse 2s ease-in-out infinite",
        }}
      >
        LEGENDARY
      </div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 16,
          color: C.text,
          letterSpacing: 2,
          textAlign: "center",
          maxWidth: 380,
          lineHeight: 1.7,
          marginTop: 4,
        }}
      >
        3 perfect matches in a row.
      </div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 13,
          color: "rgba(245,245,247,0.65)",
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        You cracked the Numerator.
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          onClick={onReplay}
          style={{
            padding: "14px 32px",
            background: C.accent,
            border: "none",
            borderRadius: 8,
            color: "#0a0a0f",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            letterSpacing: 2,
            boxShadow: "0 0 20px rgba(243,209,4,0.5)",
          }}
        >
          ▶ PLAY AGAIN
        </button>
        <button
          onClick={onShare}
          style={{
            padding: "14px 32px",
            background: "transparent",
            border: "2px solid rgba(243,209,4,0.5)",
            borderRadius: 8,
            color: C.accent,
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          SHARE
        </button>
      </div>
    </div>
  );
}

// --- Result Data Types ---
type ResultData =
  | { type: "waiting"; count: number }
  | { type: "perfect"; streak: number; round: number }
  | { type: "perfect_end"; round: number }
  | { type: "close"; triesLeft: number; diff: number }
  | { type: "streak_broken" }
  | { type: "close_exhausted" }
  | { type: "within10" }
  | { type: "far" };

// --- Main Game ---
export default function Numerator() {
  const [screen, setScreen] = useState<string>("intro");
  const [guess, setGuess] = useState("");
  const [round, setRound] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [closeTries, setCloseTries] = useState(0);
  const [onStreakPath, setOnStreakPath] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [lastResult, setLastResult] = useState("");
  const [lastPercentAway, setLastPercentAway] = useState(0);
  const [dbCount, setDbCount] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [apiResponse, setApiResponse] = useState<{
    status: string;
    correct_answer?: number;
    count?: number;
    active_count?: number;
    total_guesses: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial state
  useEffect(() => {
    apiGetState().then((data) => {
      setDbCount(data.active_count);
      setTotalGuesses(data.total_guesses);
    });
  }, []);

  useEffect(() => {
    if (screen === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [screen]);

  const handleSubmit = async () => {
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 0 || num > 100) return;

    setRound((r) => r + 1);
    setScreen("calculating");

    // Call API while flywheel spins
    const response = await apiSubmitGuess(num);
    setApiResponse(response);
    setDbCount(response.active_count ?? response.count ?? dbCount);
    setTotalGuesses(response.total_guesses);
  };

  const handleCalculationComplete = useCallback(() => {
    const num = parseInt(guess, 10);
    const response = apiResponse;

    if (!response) return;

    if (response.status === "waiting") {
      setResultData({
        type: "waiting",
        count: response.count ?? 0,
      });
      setScreen("result");
      return;
    }

    const answer = response.correct_answer!;
    const diff = Math.abs(num - answer);
    const pctAway = Math.round((diff / 100) * 100);
    setLastPercentAway(pctAway);

    if (diff === 0) {
      const newStreak = perfectStreak + 1;
      setPerfectStreak(newStreak);

      if (round === 1) {
        setOnStreakPath(true);
      }

      if (newStreak >= 3 && onStreakPath) {
        setLastResult("WIN");
        setScreen("win");
      } else if (onStreakPath || round === 1) {
        setLastResult("PERFECT");
        setResultData({ type: "perfect", streak: newStreak, round: round });
        setScreen("result");
      } else {
        setLastResult("PERFECT");
        setResultData({ type: "perfect_end", round: round });
        setScreen("result");
      }
    } else if (diff <= 5) {
      setLastResult("CLOSE");
      if (onStreakPath) {
        setResultData({ type: "streak_broken" });
        setScreen("gameover");
        setGuess("");
        return;
      }
      const newCloseTries = closeTries + 1;
      setCloseTries(newCloseTries);
      if (newCloseTries >= 3) {
        setResultData({ type: "close_exhausted" });
        setScreen("gameover");
      } else {
        setResultData({
          type: "close",
          triesLeft: 3 - newCloseTries,
          diff,
        });
        setScreen("result");
      }
    } else if (diff <= 10) {
      setLastResult("NEAR");
      setResultData(
        onStreakPath ? { type: "streak_broken" } : { type: "within10" }
      );
      setScreen("gameover");
    } else {
      setLastResult("FAR");
      setResultData(
        onStreakPath ? { type: "streak_broken" } : { type: "far" }
      );
      setScreen("gameover");
    }
    setGuess("");
  }, [guess, perfectStreak, closeTries, round, onStreakPath, apiResponse]);

  const resetGame = () => {
    setScreen("input");
    setGuess("");
    setRound(0);
    setPerfectStreak(0);
    setCloseTries(0);
    setOnStreakPath(false);
    setResultData(null);
    setLastResult("");
    setLastPercentAway(0);
    setApiResponse(null);
    // Refresh state
    apiGetState().then((data) => {
      setDbCount(data.active_count);
      setTotalGuesses(data.total_guesses);
    });
  };

  const getGameOverMessage = () => {
    if (!resultData) return "";
    switch (resultData.type) {
      case "streak_broken":
        return "Your streak was broken.";
      case "close_exhausted":
        return "3 tries used up. So close, yet so far.";
      case "within10":
        return "Not quite — you're missing something here.";
      case "far":
        return "Now you know that is not a real option.";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(243,209,4,1) 1px, transparent 1px), linear-gradient(90deg, rgba(243,209,4,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(243,209,4,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 42,
              fontWeight: "bold",
              color: C.accent,
              letterSpacing: 8,
              margin: 0,
              textShadow: "0 0 20px rgba(243,209,4,0.4)",
            }}
          >
            NUMERATOR
          </h1>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: C.success,
              letterSpacing: 4,
              marginTop: 8,
            }}
          >
            CRACK THE NUMBER
          </div>
          {round > 0 &&
            screen !== "win" &&
            screen !== "gameover" &&
            screen !== "intro" && (
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 12,
                  color: "rgba(243,209,4,0.6)",
                  marginTop: 12,
                  letterSpacing: 2,
                }}
              >
                ROUND {round}{" "}
                {onStreakPath &&
                  perfectStreak > 0 &&
                  `| 🔥 STREAK: ${perfectStreak}`}
              </div>
            )}
        </div>

        {/* Intro Screen */}
        {screen === "intro" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              animation: "fadeIn 0.6s ease-out",
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 15,
                color: "rgba(245,245,247,0.85)",
                textAlign: "center",
                lineHeight: 1.8,
                maxWidth: 400,
                letterSpacing: 0.5,
              }}
            >
              Guess a number between 0 and 100 that is{" "}
              <span style={{ color: C.accent, fontWeight: "bold" }}>
                50% of the average
              </span>{" "}
              of all the numbers guessed by every player.
            </div>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                color: "rgba(245,245,247,0.55)",
                textAlign: "center",
                lineHeight: 1.8,
                maxWidth: 360,
              }}
            >
              Think about what everyone else is thinking...
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: 20,
                background: "rgba(243,209,4,0.06)",
                border: "1px solid rgba(243,209,4,0.15)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dbCount >= 10 ? C.success : C.accent,
                  boxShadow: `0 0 6px ${
                    dbCount >= 10 ? C.success : C.accent
                  }`,
                }}
              />
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 12,
                  color: "rgba(245,245,247,0.85)",
                  letterSpacing: 1,
                }}
              >
                {dbCount} players have guessed so far
              </span>
            </div>

            <button
              onClick={() => setScreen("input")}
              style={{
                padding: "16px 48px",
                background: C.accent,
                border: "none",
                borderRadius: 8,
                color: "#0a0a0f",
                fontFamily: "'Courier New', monospace",
                fontWeight: "bold",
                fontSize: 20,
                cursor: "pointer",
                letterSpacing: 3,
                boxShadow: "0 0 30px rgba(243,209,4,0.4)",
                transition: "transform 0.1s",
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = "scale(1)";
              }}
            >
              ▶ START
            </button>
          </div>
        )}

        {/* Input Screen */}
        {screen === "input" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 16,
                background: "rgba(243,209,4,0.05)",
                border: "1px solid rgba(243,209,4,0.12)",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dbCount >= 10 ? C.success : C.accent,
                  boxShadow: `0 0 4px ${
                    dbCount >= 10 ? C.success : C.accent
                  }`,
                }}
              />
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  color: "rgba(245,245,247,0.65)",
                  letterSpacing: 1,
                }}
              >
                {dbCount} players have guessed
              </span>
            </div>

            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 13,
                color: "rgba(245,245,247,0.65)",
                letterSpacing: 2,
              }}
            >
              ENTER YOUR NUMBER
            </div>
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="100"
              value={guess}
              onChange={(e) => {
                const v = e.target.value;
                if (
                  v === "" ||
                  (parseInt(v) >= 0 && parseInt(v) <= 100)
                )
                  setGuess(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              style={{
                width: 160,
                padding: "16px 24px",
                background: "rgba(243,209,4,0.04)",
                border: "2px solid rgba(243,209,4,0.25)",
                borderRadius: 12,
                color: C.text,
                fontFamily: "'Courier New', monospace",
                fontSize: 36,
                fontWeight: "bold",
                textAlign: "center",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = C.accent;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(243,209,4,0.25)";
              }}
              placeholder="?"
            />
            <button
              onClick={handleSubmit}
              disabled={guess === ""}
              style={{
                padding: "12px 40px",
                background:
                  guess === "" ? "rgba(243,209,4,0.3)" : C.accent,
                border: "none",
                borderRadius: 8,
                color: "#0a0a0f",
                fontFamily: "'Courier New', monospace",
                fontWeight: "bold",
                fontSize: 16,
                cursor: guess === "" ? "default" : "pointer",
                letterSpacing: 2,
                transition: "background 0.2s",
              }}
            >
              LOCK IN
            </button>
          </div>
        )}

        {/* Calculating */}
        {screen === "calculating" && (
          <Flywheel onComplete={handleCalculationComplete} />
        )}

        {/* Result Screen */}
        {screen === "result" && resultData && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            {resultData.type === "waiting" && (
              <>
                <div style={{ fontSize: 48 }}>⏳</div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 18,
                    color: C.accent,
                    textAlign: "center",
                    lineHeight: 1.6,
                    letterSpacing: 1,
                  }}
                >
                  We&apos;re waiting to collect enough data before we
                  give the results.
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    color: "rgba(245,245,247,0.65)",
                    letterSpacing: 2,
                    textAlign: "center",
                  }}
                >
                  {resultData.count} of 10 guesses collected. Come
                  back and try again shortly.
                </div>
                <button
                  onClick={resetGame}
                  style={{
                    padding: "12px 32px",
                    background: C.accent,
                    border: "none",
                    borderRadius: 8,
                    color: "#0a0a0f",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "bold",
                    fontSize: 16,
                    cursor: "pointer",
                    letterSpacing: 2,
                    marginTop: 12,
                  }}
                >
                  TRY AGAIN
                </button>
              </>
            )}

            {resultData.type === "perfect" && (
              <>
                <div
                  style={{
                    fontSize: 48,
                    animation: "bounceIn 0.5s ease-out",
                  }}
                >
                  ✨
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 22,
                    color: C.success,
                    fontWeight: "bold",
                    textAlign: "center",
                    letterSpacing: 2,
                    textShadow: "0 0 15px rgba(14,141,92,0.4)",
                  }}
                >
                  YOU NAILED IT!
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 14,
                    color: "rgba(245,245,247,0.85)",
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  {resultData.round === 1
                    ? "Got it on your first attempt! Guess again to see if you can get 2 in a row!"
                    : resultData.streak === 2
                    ? `Nailed it in ${resultData.round} rounds! Can you do it one more time?`
                    : `Got it in ${resultData.round} rounds! Keep the streak alive!`}
                </div>
                <button
                  onClick={() => setScreen("input")}
                  style={{
                    padding: "14px 36px",
                    background: C.success,
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "bold",
                    fontSize: 18,
                    cursor: "pointer",
                    letterSpacing: 2,
                    boxShadow: "0 0 20px rgba(14,141,92,0.4)",
                    marginTop: 8,
                  }}
                >
                  GUESS AGAIN →
                </button>
              </>
            )}

            {resultData.type === "perfect_end" && (
              <>
                <div style={{ fontSize: 48 }}>✨</div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 20,
                    color: C.success,
                    fontWeight: "bold",
                    textAlign: "center",
                    letterSpacing: 2,
                  }}
                >
                  YOU NAILED IT!
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    color: "rgba(245,245,247,0.75)",
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Got it in {resultData.round} rounds. Nice work!
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <button
                    onClick={resetGame}
                    style={{
                      padding: "12px 28px",
                      background: C.accent,
                      border: "none",
                      borderRadius: 8,
                      color: "#0a0a0f",
                      fontFamily: "'Courier New', monospace",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: "pointer",
                      letterSpacing: 2,
                    }}
                  >
                    ▶ REPLAY
                  </button>
                  <button
                    onClick={() => setShowShare(true)}
                    style={{
                      padding: "12px 28px",
                      background: "transparent",
                      border: "2px solid rgba(243,209,4,0.5)",
                      borderRadius: 8,
                      color: C.accent,
                      fontFamily: "'Courier New', monospace",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: "pointer",
                      letterSpacing: 2,
                    }}
                  >
                    SHARE
                  </button>
                </div>
              </>
            )}

            {resultData.type === "close" && (
              <>
                <div style={{ fontSize: 48 }}>🔥</div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 20,
                    color: C.accent,
                    fontWeight: "bold",
                    textAlign: "center",
                    letterSpacing: 2,
                    textShadow: "0 0 10px rgba(243,209,4,0.3)",
                  }}
                >
                  YOU ARE SO CLOSE!
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    color: "rgba(245,245,247,0.75)",
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Off by {resultData.diff}. Guess again to see if you
                  can get it!
                  <br />
                  <span style={{ color: "rgba(243,209,4,0.7)" }}>
                    {resultData.triesLeft}{" "}
                    {resultData.triesLeft === 1 ? "try" : "tries"}{" "}
                    remaining
                  </span>
                </div>
                <button
                  onClick={() => setScreen("input")}
                  style={{
                    padding: "14px 36px",
                    background: C.accent,
                    border: "none",
                    borderRadius: 8,
                    color: "#0a0a0f",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "bold",
                    fontSize: 18,
                    cursor: "pointer",
                    letterSpacing: 2,
                    marginTop: 8,
                  }}
                >
                  GUESS AGAIN →
                </button>
              </>
            )}
          </div>
        )}

        {/* Game Over */}
        {screen === "gameover" && (
          <GameOverScreen
            rounds={round}
            percentAway={lastPercentAway}
            message={getGameOverMessage()}
            onReplay={resetGame}
            onShare={() => setShowShare(true)}
          />
        )}

        {/* Win */}
        {screen === "win" && (
          <WinScreen
            onReplay={resetGame}
            onShare={() => setShowShare(true)}
          />
        )}
      </div>

      {/* Share Card Overlay */}
      {showShare && (
        <ShareCard
          rounds={round}
          lastResult={lastResult}
          percentAway={lastPercentAway}
          totalGuesses={totalGuesses}
          onClose={() => setShowShare(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, -1px); }
          80% { transform: translate(2px, 1px); }
          100% { transform: translate(0); }
        }
        @keyframes legendaryPulse {
          0%, 100% { text-shadow: 0 0 30px rgba(243,209,4,0.6), 0 0 60px rgba(243,209,4,0.3); }
          50% { text-shadow: 0 0 50px rgba(243,209,4,0.8), 0 0 100px rgba(243,209,4,0.5), 0 0 150px rgba(243,209,4,0.2); }
        }
        @keyframes sparkleFall {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateY(500px) scale(0); opacity: 0; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] { -moz-appearance: textfield; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
