"use client";

export function LogoMark({
  size = 40,
  className = "",
  spin = false,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Noxis"
    >
      <defs>
        <linearGradient
          id="nx-vio"
          x1="10"
          y1="38"
          x2="38"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6F5FEE" />
          <stop offset="0.55" stopColor="#9A8DFF" />
          <stop offset="1" stopColor="#B9AEFF" />
        </linearGradient>
        <linearGradient
          id="nx-core"
          x1="18"
          y1="18"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8576FF" />
          <stop offset="1" stopColor="#5E4FE0" />
        </linearGradient>
        <radialGradient id="nx-cip" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#6AFFD6" />
          <stop offset="1" stopColor="#16C99B" />
        </radialGradient>
      </defs>
      <g
        className={spin ? "animate-[spin_6s_linear_infinite]" : ""}
        transform={spin ? undefined : "rotate(-28 24 24)"}
        style={{ transformOrigin: "24px 24px" }}
      >
        <ellipse
          cx="24"
          cy="24"
          rx="13"
          ry="6"
          stroke="url(#nx-vio)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="37" cy="24" r="2.6" fill="url(#nx-cip)" />
      </g>
      <circle cx="24" cy="24" r="5" fill="url(#nx-core)" />
      <circle
        cx="24"
        cy="24"
        r="5"
        stroke="#B9AEFF"
        strokeOpacity="0.6"
        strokeWidth="0.9"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} />
      <span className="text-[19px] font-semibold tracking-tight text-mist-100">
        Noxis
      </span>
    </div>
  );
}
