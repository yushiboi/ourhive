const SQRT3 = Math.sqrt(3);

const OUTER: Array<[number, number]> = [
  [0, -1],
  [1, -1],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
];

function axialToPixel(q: number, r: number, size: number) {
  return {
    x: size * SQRT3 * (q + r / 2),
    y: size * 1.5 * r,
  };
}

function hexPath(cx: number, cy: number, radius: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  });
  return pts.join(" ");
}

type HoneycombProps = {
  center: string;
  letters: string[];
  onLetter: (letter: string) => void;
  disabled?: boolean;
};

export function Honeycomb({ center, letters, onLetter, disabled }: HoneycombProps) {
  const size = 46;
  const radius = 42;
  const width = size * SQRT3 * 3 + 16;
  const height = size * 4.2 + 8;
  const ox = width / 2;
  const oy = height / 2;

  const cells = [
    { letter: center, q: 0, r: 0, center: true },
    ...letters.map((letter, i) => {
      const [q, r] = OUTER[i] ?? [0, 0];
      return { letter, q, r, center: false };
    }),
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto w-[min(100%,22rem)] select-none"
      role="group"
      aria-label="Letter hive"
    >
      {cells.map((cell) => {
        const { x, y } = axialToPixel(cell.q, cell.r, size);
        const cx = ox + x;
        const cy = oy + y;
        return (
          <g key={`${cell.q}:${cell.r}:${cell.letter}`} className="hive-cell">
            <polygon
              points={hexPath(cx, cy, radius)}
              fill={cell.center ? "#e8b84a" : "#fff9ee"}
              stroke={cell.center ? "#5a3a08" : "#2f5d3a"}
              strokeOpacity={cell.center ? 0.25 : 0.2}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none font-display font-bold"
              fontSize={28}
              fill={cell.center ? "#5a3a08" : "#1a2e22"}
            >
              {cell.letter.toUpperCase()}
            </text>
            <polygon
              points={hexPath(cx, cy, radius)}
              className="fill-transparent stroke-transparent"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={cell.center ? `Center letter ${cell.letter}` : cell.letter}
              onClick={() => !disabled && onLetter(cell.letter)}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onLetter(cell.letter);
                }
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
