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

function hexPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

type HoneycombProps = {
  center: string;
  letters: string[];
  onLetter: (letter: string) => void;
  disabled?: boolean;
};

export function Honeycomb({ center, letters, onLetter, disabled }: HoneycombProps) {
  const size = 50;
  const radius = 46;
  const pad = 10;

  const cells = [
    { letter: center, q: 0, r: 0, center: true },
    ...letters.map((letter, i) => {
      const [q, r] = OUTER[i] ?? [0, 0];
      return { letter, q, r, center: false };
    }),
  ];

  const placed = cells.map((cell) => ({ ...cell, ...axialToPixel(cell.q, cell.r, size) }));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cell of placed) {
    for (let i = 0; i < 6; i++) {
      const angle = ((60 * i - 30) * Math.PI) / 180;
      const px = cell.x + radius * Math.cos(angle);
      const py = cell.y + radius * Math.sin(angle);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }

  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  const ox = -minX + pad;
  const oy = -minY + pad;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block w-[min(100%,21rem)] select-none overflow-visible"
      role="group"
      aria-label="Letter hive"
    >
      {placed.map((cell) => {
        const cx = ox + cell.x;
        const cy = oy + cell.y;
        return (
          <g key={`${cell.q}:${cell.r}:${cell.letter}`} className="hive-cell">
            <polygon
              points={hexPoints(cx, cy, radius)}
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
              points={hexPoints(cx, cy, radius)}
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
