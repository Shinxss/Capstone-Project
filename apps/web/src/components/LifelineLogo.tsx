import lifelineLogo from "../assets/lifeline-logo_red.svg";

type Variant = "full" | "icon" | "sidebar";

type Props = {
  variant?: Variant;
  collapsed?: boolean;       // only used for sidebar variant
  iconSize?: number;         // px
  textClassName?: string;    // tailwind class for text size
  className?: string;
  showText?: boolean;        // override (optional)
};

export function LifelineLogo({
  variant = "full",
  collapsed = false,
  iconSize = 40,
  textClassName = "text-5xl",
  className = "",
  showText,
}: Props) {
  // Decide if text should show
  const textVisible =
    typeof showText === "boolean"
      ? showText
      : variant === "icon"
        ? false
        : variant === "sidebar"
          ? !collapsed
          : true;

  // Spacing/layout presets
  const wrapperClass =
    variant === "sidebar"
      ? collapsed
        ? "flex justify-center pt-7 pb-7"
        : "flex items-center gap-1 px-15 pt-7 pb-7  "
      : "flex items-center";

  return (
    <div className={`${wrapperClass} ${className}`}>
      <img
        src={lifelineLogo}
        alt="Lifeline"
        draggable={false}
        width={iconSize}
        height={iconSize}
        style={{ width: iconSize, height: iconSize }}
        className="block shrink-0"
      />

      {textVisible && (
        <div className={`${textClassName} font-extrabold leading-none tracking-tight`}>
          {/* ✅ make it "Life" not "ife" */}
          <span className="text-[#DC2626]">ife</span>
          <span className="text-gray-500">line</span>
        </div>
      )}
    </div>
  );
}
