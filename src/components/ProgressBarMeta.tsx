import { percent } from "../utils/business";

export function ProgressBarMeta({ current, total }: { current: number; total: number }) {
  const value = percent(current, total);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{current} / {total}</span><span>{value}%</span></div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${value}%` }} /></div>
    </div>
  );
}
