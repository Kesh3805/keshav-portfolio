// Scenes 4–5 — the role and the thesis. The signal changes form into a caret: it types
// SYSTEMS ENGINEER at constant speed (each character drops 10px into place, sharp), then
// transfers down a line and leads the thesis: each word rises out of a baseline mask as
// the caret passes it. At the end of the last line the caret collapses. No fades: every
// reveal is a mask or a displacement.
import { interpolate } from 'remotion';
import { IDENTITY_COPY, MONO_ADVANCE } from '../../../../web/src/lib/identity-hero';
import { typography, useColors } from '../../primitives';
import { CUES, beat, ease } from './identityStoryboard';
import { between, over, textWidth, useFrame, useLayout } from './identityShared';

const ROLE = [...IDENTITY_COPY.role];
const THESIS_TRACKING = -0.01; // em

export function Role() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const [t0, t1] = CUES.roleType;
  if (f < beat(t0)) return null;
  const { size, baseline, tracking } = l.role;
  const advance = (MONO_ADVANCE + tracking) * size;
  const typed = between(f, t0, t1, ease.data) * ROLE.length;
  const caretX = l.left + typed * advance;
  const caretOn = f < beat(CUES.thesis[0]);

  return (
    <g>
      {ROLE.map((ch, j) => {
        if (typed < j) return null;
        const at = beat(t0) + (j / ROLE.length) * beat(t1 - t0);
        const drop = over(f, at, 8);
        return (
          <text
            key={j}
            x={l.left + j * advance}
            y={baseline - 10 * (1 - drop)}
            opacity={Math.min(1, (f - at) / 2)}
            fontFamily={typography.mono}
            fontWeight={500}
            fontSize={size}
            fill={c.muted}
          >
            {ch}
          </text>
        );
      })}
      {caretOn && (
        <rect x={caretX} y={baseline - size * 0.82} width={3} height={size} fill={c.data} />
      )}
    </g>
  );
}

export function Thesis() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const [t0, t1] = CUES.thesis;
  if (f < beat(t0)) return null;
  const { size, baseline, lineHeight, lines } = l.thesis;
  const font = `600 ${size}px "IBM Plex Sans"`;
  const ls = THESIS_TRACKING * size;
  const span = (t1 - t0) / lines.length;
  const caretOut = over(f, beat(CUES.caretOut), 6, ease.structural);
  const leadWords = IDENTITY_COPY.lead.split(' ').length;

  return (
    <g>
      {lines.map((line, k) => {
        const from = t0 + k * span;
        if (f < beat(from)) return null;
        const width = textWidth(line, font, ls);
        const caretAt = (frame: number) =>
          l.left + width * between(frame, from, from + span, ease.structural);
        const sweep = between(f, from, from + span, ease.structural);
        const y = baseline + k * lineHeight;
        const last = k === lines.length - 1;
        const h = size * 1.1 * (last ? 1 - caretOut : 1);
        // Frame at which the caret reaches x: the words rise as it passes their left edge.
        const reach = (x: number) => {
          for (let fr = beat(from); fr <= beat(from + span); fr++) if (caretAt(fr) >= x) return fr;
          return beat(from + span);
        };
        const words = line.split(' ');
        let prefix = '';
        return (
          <g key={k}>
            <clipPath id={`hero-thesis-${k}`}>
              <rect x={l.left - 8} y={y - size * 1.1} width={width + 24} height={size * 1.38} />
            </clipPath>
            <g clipPath={`url(#hero-thesis-${k})`}>
              {words.map((word, j) => {
                const x = l.left + textWidth(prefix, font, ls);
                prefix += `${word} `;
                const rise = over(f, reach(x), 12, ease.type);
                if (rise <= 0) return null;
                const lead = k === 0 && j < leadWords;
                return (
                  <text
                    key={j}
                    x={x}
                    y={y + size * 0.95 * (1 - rise)}
                    fontFamily={typography.sans}
                    fontWeight={600}
                    fontSize={size}
                    letterSpacing={`${THESIS_TRACKING}em`}
                    fill={lead ? c.text : c.muted}
                  >
                    {word}
                  </text>
                );
              })}
            </g>
            {(sweep < 1 || last) && h > 0.5 && (
              <rect
                x={caretAt(f) + interpolate(sweep, [0, 1], [0, 6])}
                y={y - size * 0.86 + (size * 1.1 - h) / 2}
                width={3}
                height={h}
                fill={c.data}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
