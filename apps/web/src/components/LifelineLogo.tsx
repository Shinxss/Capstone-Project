import lifelineLogoRed from "../assets/lifeline-logo_red.svg";
import lifelineLogoBlue from "../assets/lifeline-logo_blue.svg";

type Variant = "full" | "icon" | "sidebar";

type LogoColor = "red" | "blue";

type Props = {
  variant?: Variant;
  collapsed?: boolean; // only used for sidebar variant
  iconSize?: number; // px
  textClassName?: string; // tailwind class for text size
  className?: string;
  showText?: boolean; // override (optional)
  logoColor?: LogoColor; // ✅ choose which logo svg to use
};

export function LifelineLogo({
  variant = "full",
  collapsed = false,
  iconSize = 40,
  textClassName = "text-5xl",
  className = "",
  showText,
  logoColor = "red",
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
        ? "flex justify-center pt-4 pb-3"
        : "flex items-center gap-1 px-6 pt-4 pb-3"
      : "flex items-center";

  const logoSrc = logoColor === "blue" ? lifelineLogoBlue : lifelineLogoRed;

  return (
    <div className={`${wrapperClass} ${className}`}>
      <img
        src={logoSrc}
        alt="Lifeline"
        draggable={false}
        width={iconSize}
        height={iconSize}
        style={{ width: iconSize, height: iconSize }}
        className="block shrink-0"
      />

      {textVisible && (
        <div className={`${textClassName} font-extrabold leading-none tracking-tight`}>
          <span
            className={
              logoColor === "blue"
                ? "text-blue-600 dark:text-blue-400"
                : "text-[#DC2626]"
            }
          >
            ife
          </span>
          <span className="text-gray-500 dark:text-slate-300">line</span>
        </div>
      )}
    </div>
  );
}
