// Port of design generator cat.py: flat, outlined sitting cat built from layers.
export const COATS = ['cheese', 'white', 'black', 'gray', 'calico'] as const;
export const EXPRS = ['happy', 'derp', 'deadpan', 'smug', 'sparkle'] as const;
export const FACES = ['none', 'beret', 'glasses', 'shades', 'crown', 'flower', 'tophat', 'ribbon', 'headphones', 'partyhat', 'halo', 'heartglasses', 'mustache', 'cap', 'witchhat', 'bunnyears', 'santahat', 'monocle'] as const;
export const BODIES = ['none', 'scarf', 'bowtie', 'ticketbag', 'necklace', 'camera', 'popcorn', 'hanbok', 'tie', 'lei', 'medal', 'bell'] as const;
export const BACKS = ['none', 'wings', 'cape', 'balloon', 'guitar', 'backpack', 'devilwings', 'butterfly', 'rainbow'] as const;
export const BGS = ['none', 'stage', 'paris', 'museum', 'night', 'cinema', 'festival', 'sea', 'hanok', 'concert', 'cherry', 'snow', 'space'] as const;

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
    case 'cinema':
      return '<rect width="200" height="200" fill="#2A2238"/><rect x="26" y="16" width="148" height="70" rx="4" fill="#EDE6FF"/><path d="M26 16h148v70H26z" fill="#9277FF" opacity="0.25"/><g fill="#B3364A"><rect x="8" y="164" width="34" height="30" rx="8"/><rect x="158" y="164" width="34" height="30" rx="8"/></g>';
    case 'festival':
      return '<rect width="200" height="200" fill="#FFF1D6"/><path d="M0 26q100 40 200 0" stroke="#7A5A3A" stroke-width="2" fill="none"/><path d="M20 32l8 16 8-14zM56 42l8 16 8-14zM92 46l8 16 8-16zM128 42l8 16 8-16zM164 32l8 16 8-16z" fill="#FF7A7A"/><path d="M38 38l8 16 8-14zM110 46l8 16 8-16zM146 38l8 16 8-14z" fill="#4DC3FF"/><g fill="#FFB347"><circle cx="24" cy="92" r="12"/><circle cx="176" cy="92" r="12"/></g><path d="M24 80v-8M176 80v-8" stroke="#7A5A3A" stroke-width="2"/>';
    case 'sea':
      return '<rect width="200" height="200" fill="#CDEBFF"/><circle cx="160" cy="42" r="18" fill="#FFE07A"/><rect y="118" width="200" height="82" fill="#6EC1E4"/><path d="M0 130q12-8 24 0t24 0 24 0 24 0 24 0 24 0 24 0 24 0" stroke="#fff" stroke-width="4" fill="none"/><rect y="170" width="200" height="30" fill="#F7DFA8"/>';
    case 'hanok':
      return '<rect width="200" height="200" fill="#F6EAD7"/><path d="M-4 52q104-36 208 0l-8 16q-96-26-192 0z" fill="#4A3B32"/><rect x="18" y="66" width="164" height="8" fill="#8A5A3A"/><g fill="#A0714A"><rect x="26" y="74" width="8" height="110"/><rect x="166" y="74" width="8" height="110"/></g><rect y="180" width="200" height="20" fill="#D9C3A0"/>';
    case 'concert':
      return '<rect width="200" height="200" fill="#1E1630"/><path d="M30 0l30 200H0zM170 0l30 200h-60z" fill="#FFE9A8" opacity="0.18"/><path d="M100 0l26 200H74z" fill="#C9B8FF" opacity="0.18"/><g fill="#FF8DB8"><circle cx="20" cy="190" r="10"/><circle cx="50" cy="194" r="9"/><circle cx="150" cy="194" r="9"/><circle cx="180" cy="190" r="10"/></g>';
    case 'cherry':
      return '<rect width="200" height="200" fill="#FFF0F4"/><path d="M0 40q40-30 80-10M200 30q-40-20-70 6" stroke="#8A5A4A" stroke-width="5" fill="none"/><g fill="#FFB7CB"><circle cx="20" cy="30" r="9"/><circle cx="46" cy="22" r="8"/><circle cx="70" cy="30" r="9"/><circle cx="150" cy="26" r="9"/><circle cx="178" cy="22" r="8"/><circle cx="30" cy="120" r="4"/><circle cx="170" cy="100" r="4"/><circle cx="160" cy="150" r="3.5"/><circle cx="40" cy="160" r="3.5"/></g>';
    case 'snow':
      return '<rect width="200" height="200" fill="#DCEBFA"/><rect y="170" width="200" height="30" fill="#FFFFFF"/><g fill="#FFFFFF"><circle cx="20" cy="30" r="4"/><circle cx="60" cy="60" r="3"/><circle cx="160" cy="24" r="4"/><circle cx="180" cy="80" r="3"/><circle cx="30" cy="110" r="3.5"/><circle cx="172" cy="130" r="3.5"/><circle cx="110" cy="14" r="3"/></g>';
    case 'space':
      return '<rect width="200" height="200" fill="#141033"/><circle cx="160" cy="44" r="20" fill="#F2A65A"/><ellipse cx="160" cy="44" rx="32" ry="7" fill="none" stroke="#FFD9A8" stroke-width="3"/><g fill="#fff"><circle cx="30" cy="30" r="2"/><circle cx="80" cy="18" r="1.5"/><circle cx="20" cy="100" r="2"/><circle cx="182" cy="120" r="1.5"/><circle cx="40" cy="160" r="1.5"/></g>';
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
  if (kind === 'guitar')
    return `<path d="M150 132l16-96" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M150 132l16-96" stroke="#8A5A30" stroke-width="6" stroke-linecap="round"/><ellipse cx="148" cy="150" rx="22" ry="26" fill="#D9934E" ${o()}/><circle cx="148" cy="146" r="7" fill="${INK}"/>`;
  if (kind === 'butterfly') {
    const w = (d: string, c: string) => `<path d="${d}" fill="${c}" ${o('', 4)}/>`;
    return w('M70 120c-30-30-50-20-46 0 4 16 26 18 46 6z', '#9FD8FF') + w('M130 120c30-30 50-20 46 0-4 16-26 18-46 6z', '#9FD8FF') + w('M72 132c-20 6-30 24-18 32 10 6 22-8 22-24z', '#FFB7CB') + w('M128 132c20 6 30 24 18 32-10 6-22-8-22-24z', '#FFB7CB');
  }
  if (kind === 'rainbow')
    return ['#FF6B6B', '#FFB347', '#FFE066', '#7BD389', '#6EC1E4', '#9277FF'].map((c, i) => `<path d="M${20 + i * 7} 150a${80 - i * 7} ${80 - i * 7} 0 0 1 ${160 - i * 14} 0" fill="none" stroke="${c}" stroke-width="7"/>`).join('');
  if (kind === 'backpack') return `<rect x="50" y="118" width="100" height="58" rx="20" fill="#4DA36B" ${o()}/>`;
  if (kind === 'devilwings') {
    const w = `fill="#7A4A9A" ${o()}`;
    return `<path d="M66 128c-24-2-42-20-44-44l12 8 6-14 8 12 8-10c0 18 2 34 10 48z" ${w}/><path d="M134 128c24-2 42-20 44-44l-12 8-6-14-8 12-8-10c0 18-2 34-10 48z" ${w}/>`;
  }
  return '';
}

function bodyDeco(kind: Body): string {
  if (kind === 'scarf')
    return `<path d="M66 118q34 14 68 0l2 12q-36 14-72 0z" fill="#E4574C" ${o()}/><path d="M116 126l6 26 12-4-6-24z" fill="#E4574C" ${o()}/>`;
  if (kind === 'bowtie')
    return `<path d="M100 124l-18-10v20zM100 124l18-10v20z" fill="#3D5AFE" ${o()}/><circle cx="100" cy="124" r="5" fill="#3D5AFE" ${o()}/>`;
  if (kind === 'ticketbag')
    return `<path d="M62 120l70 38" stroke="${INK}" stroke-width="4"/><rect x="120" y="148" width="30" height="24" rx="6" fill="#F2C14E" ${o()}/><rect x="126" y="140" width="18" height="12" rx="2" fill="#fff" ${O3}/>`;
  if (kind === 'tie') return `<path d="M94 128h12l-2 6 6 28-10 10-10-10 6-28z" fill="#3D5AFE" ${O4}/>`;
  if (kind === 'lei')
    return [68, 78, 88, 100, 112, 122, 132].map((x, i) => `<circle cx="${x}" cy="${142 - Math.abs(i - 3) * 2.5}" r="6.5" fill="${['#FF7AA8', '#FFD24D', '#FF9F43'][i % 3]}" ${O3}/>`).join('');
  if (kind === 'medal')
    return `<path d="M88 128l12 20 12-20" fill="none" stroke="#3D5AFE" stroke-width="6"/><circle cx="100" cy="156" r="11" fill="#FFD24D" ${O4}/><path d="M100 150l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#E08A3C"/>`;
  if (kind === 'bell')
    return `<path d="M68 128q32 12 64 0" fill="none" stroke="#E4574C" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="142" r="9" fill="#FFD24D" ${O4}/><path d="M95 145h10" ${O3}/>`;
  if (kind === 'necklace')
    return [70, 79, 88, 97, 106, 115, 124, 133].map((x, i) => `<circle cx="${x}" cy="${146 - Math.abs(i - 3.5) * 2}" r="4.5" fill="#FFFFFF" ${o('', 2)}/>`).join('');
  if (kind === 'camera')
    return `<path d="M64 118l60 30" stroke="${INK}" stroke-width="4"/><rect x="108" y="140" width="38" height="26" rx="6" fill="#3A3A48" ${O4}/><circle cx="127" cy="153" r="8" fill="#9AD0FF" ${O3}/><rect x="112" y="136" width="10" height="6" rx="2" fill="#3A3A48" ${O3}/>`;
  if (kind === 'popcorn')
    return `<g>${[[60, 136], [70, 130], [80, 136], [66, 140], [76, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#FFF6D8" ${O3}/>`).join('')}<path d="M56 142h30l-4 32H60z" fill="#FFFFFF" ${O4}/><path d="M64 142l1 32M72 142v32M80 142l-1 32" stroke="#E4574C" stroke-width="4"/></g>`;
  if (kind === 'hanbok')
    return `<path d="M70 122l30 22 30-22" fill="none" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/><path d="M70 122l30 22 30-22" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linejoin="round"/><path d="M100 146l-10 26M100 146l12 24" stroke="#E4574C" stroke-width="7" stroke-linecap="round"/>`;
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
  if (kind === 'cap')
    return `<path d="M56 54c0-22 20-34 44-34s44 12 44 34z" fill="#E4574C" ${o()}/><path d="M138 54h28q4 6-4 8h-30z" fill="#E4574C" ${o('', 5)}/><circle cx="100" cy="20" r="4" fill="#E4574C" ${O3}/>`;
  if (kind === 'witchhat')
    return `<path d="M100 -4l-30 52h60z" fill="#4A2A5A" ${o()}/><rect x="48" y="44" width="104" height="10" rx="5" fill="#4A2A5A" ${o()}/><rect x="74" y="36" width="52" height="7" fill="#9277FF"/>`;
  if (kind === 'bunnyears')
    return `<ellipse cx="76" cy="20" rx="10" ry="26" fill="#FFFFFF" ${o('', 5)}/><ellipse cx="124" cy="20" rx="10" ry="26" fill="#FFFFFF" ${o('', 5)}/><ellipse cx="76" cy="22" rx="4" ry="16" fill="#FFB7CB"/><ellipse cx="124" cy="22" rx="4" ry="16" fill="#FFB7CB"/><path d="M60 46q40-12 80 0" stroke="#FF7AA8" stroke-width="6" fill="none"/>`;
  if (kind === 'santahat')
    return `<path d="M58 50c4-30 30-42 56-36 14 4 28 16 34 32-10-6-20-4-24 4z" fill="#E4574C" ${o()}/><rect x="52" y="42" width="96" height="14" rx="7" fill="#FFFFFF" ${o('', 4)}/><circle cx="150" cy="44" r="8" fill="#FFFFFF" ${O4}/>`;
  if (kind === 'monocle') return `<circle cx="122" cy="86" r="15" fill="#FFFFFF" fill-opacity="0.25" stroke="#C9A86A" stroke-width="4"/><path d="M136 92q6 20 0 36" stroke="#C9A86A" stroke-width="2" fill="none"/>`;
  if (kind === 'tophat')
    return `<rect x="74" y="4" width="52" height="40" rx="4" fill="#2B2B3A" ${o()}/><rect x="74" y="32" width="52" height="7" fill="#C2413A"/><rect x="56" y="40" width="88" height="10" rx="5" fill="#2B2B3A" ${o()}/>`;
  if (kind === 'ribbon') return `<path d="M58 40l-20-12v26zM58 40l20-12v26z" fill="#FF7AA8" ${o('', 4)}/><circle cx="58" cy="40" r="6" fill="#FF7AA8" ${O4}/>`;
  if (kind === 'headphones')
    return `<path d="M36 92q0-74 64-74t64 74" fill="none" stroke="${INK}" stroke-width="14"/><path d="M36 92q0-74 64-74t64 74" fill="none" stroke="#7C5CFF" stroke-width="8"/><rect x="22" y="76" width="22" height="34" rx="9" fill="#7C5CFF" ${O4}/><rect x="156" y="76" width="22" height="34" rx="9" fill="#7C5CFF" ${O4}/>`;
  if (kind === 'partyhat')
    return `<path d="M100 0l22 48H78z" fill="#4DC3FF" ${o()}/><circle cx="94" cy="30" r="3.5" fill="#FFD24D"/><circle cx="106" cy="40" r="3.5" fill="#FF7A9A"/><circle cx="102" cy="18" r="3" fill="#fff"/><circle cx="100" cy="0" r="6" fill="#FF7A9A" ${O3}/>`;
  if (kind === 'halo') return '<ellipse cx="100" cy="14" rx="34" ry="8" fill="none" stroke="#FFD24D" stroke-width="7"/>';
  if (kind === 'heartglasses') {
    const h = (cx: number) => `<path d="M${cx} 98c-18-10-20-22-12-28 5-4 10-2 12 3 2-5 7-7 12-3 8 6 6 18-12 28z" fill="#FF4F7B" ${O3}/>`;
    return h(78) + h(122) + `<path d="M90 82h20" ${O4}/>`;
  }
  if (kind === 'mustache') return `<path d="M100 100q-14-10-30 0q14 6 30 0zM100 100q14-10 30 0q-14 6-30 0z" fill="${INK}"/>`;
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
