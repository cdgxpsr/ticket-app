// Supabase Edge Function (Deno): POST { image: base64, mediaType } -> ticket fields JSON.
// JWT is verified by the platform (verify_jwt = true). ANTHROPIC_API_KEY is a function secret only.
const CATEGORIES = ['영화', '뮤지컬', '연극', '콘서트', '전시', '박물관', '스포츠', '액티비티', '기타'];
const MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PROMPT = `이 이미지는 한국 또는 해외의 공연·전시·스포츠 등 관람 티켓입니다. 티켓에 적힌 정보를 읽어 아래 형식의 JSON 객체 하나만 출력하세요. 설명, 마크다운, 코드 블록 없이 JSON만 출력합니다.
{"category": "${CATEGORIES.join('|')} 중 하나", "title": "공연·전시 이름", "date": "YYYY.MM.DD", "time": "HH:MM (24시간)", "venue": "장소", "seat": "좌석(예: R석 7열 12번, 없으면 빈 문자열)"}
규칙: 보이지 않거나 확실하지 않은 값은 빈 문자열로 두세요. 가격 정보는 포함하지 마세요. 원문이 한국어면 한국어 그대로 적으세요.`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function validate(raw: unknown) {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, 200) : '');
  const category = CATEGORIES.includes(s('category')) ? s('category') : '기타';
  return { category, title: s('title'), date: s('date'), time: s('time'), venue: s('venue'), seat: s('seat') };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ error: 'server_not_configured' }, 500);

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const image = body.image;
  const mediaType = typeof body.mediaType === 'string' ? body.mediaType : 'image/jpeg';
  if (typeof image !== 'string' || !image || image.length > 7_000_000) return json({ error: 'invalid_image' }, 400);
  if (!MEDIA.includes(mediaType)) return json({ error: 'invalid_media_type' }, 400);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
    if (!res.ok) {
      console.error('anthropic error', res.status, await res.text());
      return json({ error: 'recognize_failed' }, 502);
    }
    const msg = await res.json();
    const text = (msg.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: 'recognize_failed' }, 502);
    return json(validate(JSON.parse(m[0])));
  } catch (e) {
    console.error('recognize error', (e as Error).message);
    return json({ error: 'recognize_failed' }, 502);
  }
});
