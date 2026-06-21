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
          id="nx-s"
          x1="10"
          y1="38"
          x2="38"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6354E6" />
          <stop offset="0.55" stopColor="#9A8DFF" />
          <stop offset="1" stopColor="#B3A8FF" />
        </linearGradient>
        <radialGradient id="nx-n" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#5BFFD2" />
          <stop offset="1" stopColor="#13C99B" />
        </radialGradient>
      </defs>
      <path
        d="M13 37 V13 L35 35 V11"
        stroke="url(#nx-s)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="3.4" fill="url(#nx-n)" />
      <circle
        cx="24"
        cy="24"
        r="6.2"
        stroke="#2BF0BE"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        className={spin ? "origin-center animate-[spin_8s_linear_infinite]" : ""}
        style={{ transformBox: "fill-box" }}
      />
      <path
        d="M7 24 H10.5"
        stroke="#9A8DFF"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M37.5 24 H41"
        stroke="#9A8DFF"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
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
