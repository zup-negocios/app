import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function getTimeLeft(deadline: string) {
  const expiresAt = new Date(`${deadline}T23:59:59`).getTime();
  const diff = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

export function OfferCountdown({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = window.setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  const label = useMemo(() => {
    if (timeLeft.expired) return "Oferta expirada";
    return `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, "0")}h ${String(timeLeft.minutes).padStart(2, "0")}m ${String(timeLeft.seconds).padStart(2, "0")}s`;
  }, [timeLeft]);

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}`}>
      <Clock size={compact ? 14 : 16} />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
