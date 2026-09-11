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
  const size = 48;
  const radius = 44;
  const width = size * SQRT3 * 3 + 8;
  const height = size * 4.2;
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
      className="mx-auto w-[min(100%,20.5rem)] select-none"
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
              className={cell.center ? "fill-honey" : "fill-cell"}
            />
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`pointer-events-none ${cell.center ? "fill-honey-ink" : "fill-ink"}`}
              fontSize={26}
              fontWeight={700}
              fontFamily="Outfit, system-ui, sans-serif"
            >
              {cell.letter.toUpperCase()}
            </text>
            <polygon
              points={hexPath(cx, cy, radius)}
              fill="transparent"
              className="cursor-pointer"
              aria-label={cell.center ? `Center letter ${cell.letter}` : cell.letter}
              onPointerDown={(event) => {
                event.preventDefault();
                if (!disabled) onLetter(cell.letter);
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
