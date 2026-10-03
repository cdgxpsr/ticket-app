// Port of design generator cat.py: flat, outlined sitting cat built from layers.
export const COATS = ['cheese', 'white', 'black', 'gray', 'calico'] as const;
export const EXPRS = ['happy', 'derp', 'deadpan', 'smug', 'sparkle'] as const;
export const FACES = ['none', 'beret', 'glasses', 'shades', 'crown', 'flower'] as const;
export const BODIES = ['none', 'scarf', 'bowtie', 'ticketbag'] as const;
export const BACKS = ['none', 'wings', 'cape', 'balloon'] as const;
export const BGS = ['none', 'stage', 'paris', 'museum', 'night'] as const;

export type Coat = (typeof COATS)[number];
export type Expr = (typeof EXPRS)[number];
export type Face = (typeof FACES)[number];
export type Body = (typeof BODIES)[number];
export type Back = (typeof BACKS)[number];
export type Bg = (typeof BGS)[number];

export type AvatarOptions = { coat: Coat; expr: Expr; face: Face; body: Body; back: Back; bg: Bg };

export const DEFAULT_AVATAR: AvatarOptions = { coat: 'cheese', expr: 'happy', face: 'beret', body: 'scarf', back: 'none', bg: 'none' };

const INK = '#3A2418';
const COAT_STYLE: Record<Coat, { fill: string; mark: string; mask: boolean; patches?: boolean }> = {
  cheese: { fill: '#F7B96B', mark: '#E08A3C', mask: true },
  white: { fill: '#FFFFFF', mark: '#F2D4C8', mask: false },
  black: { fill: '#2E2626', mark: '#2E2626', mask: false },
  gray: { fill: '#C9CDD2', mark: '#9AA0A8', mask: true },
  calico: { fill: '#FFFFFF', mark: '#F2B36A', mask: false, patches: true },
};
const SW = 6;

const o = (extra = '', w = SW) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const O3 = o('', 3), O4 = o('', 4), O5 = o('', 5);
const ON4 = o('fill="none"', 4), ON5 = o('fill="none"', 5);

function background(kind: Bg): string {
  switch (kind) {
    case 'stage':
      return '<rect width="200" height="200" fill="#FBE3D6"/><path d="M0 0h200v18H0z" fill="#C2413A"/><path d="M0 0q22 80 6 200H0zM200 0q-22 80-6 200h6z" fill="#D9534A"/><ellipse cx="100" cy="186" rx="80" ry="10" fill="#F7C9A8"/>';
    case 'paris':
      return '<rect width="200" height="200" fill="#FDE6CF"/><circle cx="150" cy="58" r="22" fill="#FFD27A"/><path d="M40 190l14-60 6-50 4-40 4 40 6 50 14 60h-10q-14-24-28 0z" fill="#E7B48C"/><path d="M52 130h24M56 82h16" stroke="#E7B48C" stroke-width="4"/>';
    case 'museum':
      return '<rect width="200" height="200" fill="#EFE7DA"/><rect x="20" y="30" width="54" height="42" rx="3" fill="#fff" stroke="#C9A86A" stroke-width="5"/><path d="M26 66l14-16 10 10 8-6 10 12z" fill="#9CC3A8"/><rect x="128" y="22" width="50" height="62" rx="3" fill="#fff" stroke="#C9A86A" stroke-width="5"/><circle cx="153" cy="50" r="12" fill="#F2A7A0"/><rect y="176" width="200" height="24" fill="#E3D4BE"/>';
    case 'night':
      return '<rect width="200" height="200" fill="#2E2A4A"/><circle cx="152" cy="46" r="18" fill="#FFE8A3"/><circle cx="160" cy="40" r="16" fill="#2E2A4A"/><path d="M40 40l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM90 22l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5zM30 110l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FFE8A3"/>';
    default:
      return '';
  }
}

function backDeco(kind: Back): string {
  if (kind === 'wings') {
    const w = `fill="#FFFFFF" ${o()}`;
    return `<path d="M66 132c-30-6-46-30-40-52 10 10 22 12 30 10-8 10-4 24 10 30z" ${w}/><path d="M134 132c30-6 46-30 40-52-10 10-22 12-30 10 8 10 4 24-10 30z" ${w}/>`;
  }
  if (kind === 'cape') return `<path d="M64 124c-10 20-14 44-10 60h92c4-16 0-40-10-60z" fill="#8E1F2F" ${o()}/>`;
  if (kind === 'balloon')
    return `<path d="M140 130q14-40 10-74" stroke="${INK}" stroke-width="3" fill="none"/><ellipse cx="150" cy="40" rx="20" ry="24" fill="#FF8FA3" ${o()}/><ellipse cx="143" cy="32" rx="5" ry="8" fill="#fff" opacity="0.6"/>`;
  return '';
}

function bodyDeco(kind: Body): string {
  if (kind === 'scarf')
    return `<path d="M66 118q34 14 68 0l2 12q-36 14-72 0z" fill="#E4574C" ${o()}/><path d="M116 126l6 26 12-4-6-24z" fill="#E4574C" ${o()}/>`;
  if (kind === 'bowtie')
    return `<path d="M100 124l-18-10v20zM100 124l18-10v20z" fill="#3D5AFE" ${o()}/><circle cx="100" cy="124" r="5" fill="#3D5AFE" ${o()}/>`;
  if (kind === 'ticketbag')
    return `<path d="M62 120l70 38" stroke="${INK}" stroke-width="4"/><rect x="120" y="148" width="30" height="24" rx="6" fill="#F2C14E" ${o()}/><rect x="126" y="140" width="18" height="12" rx="2" fill="#fff" ${O3}/>`;
  return '';
}

function faceDeco(kind: Face): string {
  if (kind === 'beret')
    return `<path d="M58 52c-2-18 26-30 52-28s44 16 36 30c-24-10-58-10-88-2z" fill="#D94A3D" ${o()}/><path d="M104 24l4-10" ${o()}/>`;
  if (kind === 'glasses')
    return `<circle cx="78" cy="86" r="15" fill="#FFFFFF" fill-opacity="0.25" ${O4}/><circle cx="122" cy="86" r="15" fill="#FFFFFF" fill-opacity="0.25" ${O4}/><path d="M93 86h14" ${O4}/>`;
  if (kind === 'shades') {
    const r = (x: number, y: number, w: number, h: number, c = INK) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
    return r(56, 76, 88, 7) + r(60, 83, 32, 7) + r(108, 83, 32, 7) + r(64, 90, 24, 7) + r(112, 90, 24, 7) + r(66, 83, 6, 6, '#fff') + r(114, 83, 6, 6, '#fff');
  }
  if (kind === 'crown') return `<path d="M72 44l6-22 12 12 10-18 10 18 12-12 6 22z" fill="#FFD24D" ${o()}/><circle cx="100" cy="36" r="4" fill="#E04848"/>`;
  if (kind === 'flower')
    return (
      [[0, -8], [8, 0], [0, 8], [-8, 0]].map(([dx, dy]) => `<circle cx="${142 + dx}" cy="${40 + dy}" r="7" fill="#FFB3C7" ${O3}/>`).join('') +
      `<circle cx="142" cy="40" r="5" fill="#FFD24D" ${O3}/>`
    );
  return '';
}

function expression(kind: Expr): string {
  switch (kind) {
    case 'happy':
      return `<circle cx="78" cy="86" r="8" fill="${INK}"/><circle cx="122" cy="86" r="8" fill="${INK}"/><path d="M92 98q4 6 8 0q4 6 8 0" ${ON4}/><path d="M95 101q5 12 10 0z" fill="#F07A6A" ${O3}/>`;
    case 'derp':
      return `<circle cx="78" cy="86" r="10" fill="#fff" ${O4}/><circle cx="80" cy="88" r="4" fill="${INK}"/><circle cx="122" cy="88" r="5" fill="${INK}"/><path d="M92 98q4 5 8 0q4 5 8 0" ${ON4}/><path d="M102 101q2 10 8 8t0-8z" fill="#F07A6A" ${O3}/>`;
    case 'deadpan':
      return `<path d="M68 86h20M112 86h20" ${O5}/><path d="M95 100h10" ${O4}/><path d="M140 66q6 8 0 12q-6-4 0-12z" fill="#8FD3F5"/>`;
    case 'smug':
      return `<path d="M68 88q10-8 20 0M112 88q10-8 20 0" ${ON5}/><path d="M94 99q5 5 10 0q3 4 8-2" ${ON4}/>`;
    case 'sparkle':
      return `<circle cx="78" cy="86" r="10" fill="${INK}"/><circle cx="122" cy="86" r="10" fill="${INK}"/><circle cx="81" cy="82" r="3.5" fill="#fff"/><circle cx="125" cy="82" r="3.5" fill="#fff"/><circle cx="75" cy="90" r="1.8" fill="#fff"/><circle cx="119" cy="90" r="1.8" fill="#fff"/><path d="M93 99q3.5 5 7 0q3.5 5 7 0" ${ON4}/>`;
  }
}

export function catSvg(opts: Partial<AvatarOptions> = {}): string {
  const { coat, expr, face, body, back, bg } = { ...DEFAULT_AVATAR, ...opts };
  const C = COAT_STYLE[coat] ?? COAT_STYLE.cheese;
  const f = C.fill;
  let s = '<svg viewBox="0 0 200 200" aria-hidden="true">';
  s += background(bg);
  s += '<ellipse cx="100" cy="182" rx="56" ry="8" fill="#000" opacity="0.12"/>';
  s += backDeco(back);
  s += `<path d="M136 172q36 2 34-34" fill="none" stroke="${INK}" stroke-width="${SW + 10}" stroke-linecap="round"/>`;
  s += `<path d="M136 172q36 2 34-34" fill="none" stroke="${f}" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path d="M66 178c-6-28 4-48 34-50 30 2 40 22 34 50z" fill="${f}" ${o()}/>`;
  if (C.mask || coat === 'calico') s += '<path d="M84 178c-4-22 2-40 16-42 14 2 20 20 16 42z" fill="#FFFFFF"/>';
  if (C.patches) s += '<path d="M120 130c10 4 16 14 16 26-8-2-14-10-16-26z" fill="#4A403C"/>';
  s += `<path d="M88 146v30M112 146v30" ${O5}/>`;
  s += `<ellipse cx="86" cy="178" rx="11" ry="6" fill="#FFFFFF" ${O5}/><ellipse cx="114" cy="178" rx="11" ry="6" fill="#FFFFFF" ${O5}/>`;
  s += bodyDeco(body);
  // ears (right ear keeps its notch)
  s += `<path d="M44 70l2-34 32 16z" fill="${f}" ${o()}/><path d="M156 70l-2-34-32 16z" fill="${f}" ${o()}/><path d="M150 40l-6 6" stroke="#3A2418" stroke-width="5"/>`;
  s += '<path d="M52 58l1-14 13 7z" fill="#F7A6B4"/><path d="M148 58l-1-14-13 7z" fill="#F7A6B4"/>';
  // wide flat head
  s += `<path d="M34 96c0-34 28-52 66-52s66 18 66 52c0 26-26 40-66 40s-66-14-66-40z" fill="${f}" ${o()}/>`;
  if (C.mask) s += '<path d="M56 104c4-20 24-22 44-14 20-8 40-6 44 14-4 20-24 28-44 28s-40-8-44-28z" fill="#FFFFFF"/>';
  if (C.patches)
    s += '<path d="M44 76c4-22 18-34 36-36-2 18-14 34-36 36z" fill="#4A403C"/><path d="M156 78c-4-22-18-34-36-36 2 18 14 34 36 36z" fill="#F2B36A"/>';
  if (coat === 'cheese' || coat === 'gray') s += `<path d="M92 50v10M100 48v12M108 50v10" stroke="${C.mark}" stroke-width="5" stroke-linecap="round"/>`;
  s += '<ellipse cx="60" cy="112" rx="10" ry="5" fill="#FF8FA3" opacity="0.55"/><ellipse cx="140" cy="112" rx="10" ry="5" fill="#FF8FA3" opacity="0.55"/>';
  s += `<path d="M18 102h16M16 112l18-3M166 102h16M166 109l18 3" ${O4}/>`;
  let ex = expression(expr) ?? '';
  if (coat === 'black') ex = ex.split(`fill="${INK}"`).join('fill="#FFE27A"').split(`stroke="${INK}"`).join('stroke="#FFE27A"');
  s += `<g transform="translate(100 96) scale(1.15 1) translate(-100 -88)">${ex}${faceDeco(face)}</g>`;
  return s + '</svg>';
}
