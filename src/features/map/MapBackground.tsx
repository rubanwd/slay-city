/**
 * Decorative neon-city backdrop for the map. Purely presentational and
 * non-interactive — it sits behind the location nodes. Stretched to fill
 * (preserveAspectRatio="none") so the skyline always hugs the bottom edge.
 */
export default function MapBackground() {
  // A few pseudo-random stars — fixed so the layout is stable between renders.
  const stars = [
    [8, 12], [18, 8], [30, 16], [44, 6], [58, 14], [70, 9], [86, 12], [93, 20],
    [14, 30], [38, 34], [64, 28], [88, 36], [24, 46], [52, 42], [76, 48],
  ];

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241246" />
          <stop offset="55%" stopColor="#0a0616" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="mapGlowPink" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF2D8E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF2D8E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mapGlowCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="100" height="100" fill="url(#mapSky)" />

      {/* Neon glows */}
      <ellipse cx="22" cy="24" rx="42" ry="34" fill="url(#mapGlowPink)" />
      <ellipse cx="82" cy="58" rx="40" ry="34" fill="url(#mapGlowCyan)" />

      {/* Stars */}
      <g fill="#ffffff">
        {stars.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={0.35} opacity={0.7} />
        ))}
      </g>

      {/* City skyline silhouette */}
      <g fill="#160a2b" stroke="#6A00FF" strokeWidth="0.4" strokeOpacity="0.6">
        <rect x="-1" y="84" width="12" height="18" />
        <rect x="11" y="76" width="9" height="26" />
        <rect x="20" y="88" width="10" height="14" />
        <rect x="30" y="80" width="8" height="22" />
        <rect x="38" y="86" width="11" height="16" />
        <rect x="49" y="74" width="9" height="28" />
        <rect x="58" y="83" width="10" height="19" />
        <rect x="68" y="78" width="8" height="24" />
        <rect x="76" y="87" width="11" height="15" />
        <rect x="87" y="79" width="9" height="23" />
        <rect x="96" y="85" width="6" height="17" />
      </g>

      {/* Lit windows on the skyline */}
      <g fill="#9DFF00" fillOpacity="0.55">
        <rect x="13" y="80" width="1.2" height="1.6" />
        <rect x="16" y="84" width="1.2" height="1.6" />
        <rect x="51" y="78" width="1.2" height="1.6" />
        <rect x="54" y="83" width="1.2" height="1.6" />
        <rect x="70" y="82" width="1.2" height="1.6" />
        <rect x="89" y="83" width="1.2" height="1.6" />
      </g>
    </svg>
  );
}
