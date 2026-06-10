import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(score)}
          className={onChange ? "text-orange-500" : "text-orange-500 cursor-default"}
          aria-label={`${score} estrelas`}
        >
          <Star size={size} fill={score <= Math.round(value) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
