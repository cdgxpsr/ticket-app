// Vercel 호환 서버리스 핸들러: POST { image: base64, mediaType } -> 티켓 항목 JSON
// ANTHROPIC_API_KEY 는 서버 환경 변수에만 둔다. 앱 번들에는 절대 포함하지 않는다.
import Anthropic from '@anthropic-ai/sdk';

const CATEGORIES = ['영화', '뮤지컬', '연극', '콘서트', '전시', '박물관', '스포츠', '액티비티', '기타'];
const MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PROMPT = `이 이미지는 한국 또는 해외의 공연·전시·스포츠 등 관람 티켓입니다. 티켓에 적힌 정보를 읽어 아래 형식의 JSON 객체 하나만 출력하세요. 설명, 마크다운, 코드 블록 없이 JSON만 출력합니다.
{"category": "${CATEGORIES.join('|')} 중 하나", "title": "공연·전시 이름", "date": "YYYY.MM.DD", "time": "HH:MM (24시간)", "venue": "장소", "seat": "좌석(예: R석 7열 12번, 없으면 빈 문자열)"}
규칙: 보이지 않거나 확실하지 않은 값은 빈 문자열로 두세요. 가격 정보는 포함하지 마세요. 원문이 한국어면 한국어 그대로 적으세요.`;

export function validate(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const s = (k) => (typeof o[k] === 'string' ? o[k].trim().slice(0, 200) : '');
  const category = CATEGORIES.includes(s('category')) ? s('category') : '기타';
  return { category, title: s('title'), date: s('date'), time: s('time'), venue: s('venue'), seat: s('seat') };
}

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no json');
  return JSON.parse(m[0]);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'server_not_configured' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { image, mediaType = 'image/jpeg' } = body;
  if (typeof image !== 'string' || !image || image.length > 7_000_000) return res.status(400).json({ error: 'invalid_image' });
  if (!MEDIA.includes(mediaType)) return res.status(400).json({ error: 'invalid_media_type' });

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return res.status(200).json(validate(parseJson(text)));
  } catch (e) {
    console.error('recognize error', e?.message);
    return res.status(502).json({ error: 'recognize_failed' });
  }
}
