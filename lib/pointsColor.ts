
/**
 * Utility to determine the color of task points notation based on the room's point limit.
 * 
 * Very small tasks: gray (< 5% of limit)
 * small tasks: blue (5-15% of limit)
 * medium tasks: green (15-30% of limit)
 * medium/large: yellow (30-50% of limit)
 * large: red (50-80% of limit)
 * super large: purple (> 80% of limit)
 */

export interface PointColorClasses {
  text: string;
  bg: string;
  border: string;
}

export function getPointColorClasses(points: number, limit: number | null): PointColorClasses {
  // Default to blue if no limit is set
  if (!limit || limit <= 0) {
    return {
      text: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    };
  }

  const ratio = points / limit;

  if (ratio < 0.05) {
    // Very small: gray
    return {
      text: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    };
  } else if (ratio < 0.15) {
    // Small: blue
    return {
      text: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    };
  } else if (ratio < 0.30) {
    // Medium: green
    return {
      text: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    };
  } else if (ratio < 0.50) {
    // Medium/large: yellow
    return {
      text: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    };
  } else if (ratio < 0.80) {
    // Large: red
    return {
      text: "text-danger",
      bg: "bg-danger/10",
      border: "border-danger/20",
    };
  } else {
    // Super large: purple
    return {
      text: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    };
  }
}
