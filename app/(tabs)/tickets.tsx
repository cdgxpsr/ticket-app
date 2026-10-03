import { CatAvatar } from '../../src/components/CatAvatar';
import { Screen } from '../../src/components/Screen';
import { Ticket, TicketCard } from '../../src/components/TicketCard';

const SAMPLE: Ticket[] = [
  { id: '1', title: '고양이 뮤지컬', venue: '냥냥아트홀', date: '2026.11.14', seat: 'R석 7열' },
  { id: '2', title: '야옹 재즈 나이트', venue: '꾹꾹이 라운지', date: '2026.12.02', seat: '스탠딩' },
  { id: '3', title: '집사 사진전', venue: '털뭉치 갤러리', date: '2027.01.09', seat: '자유 관람' },
];

export default function Tickets() {
  return (
    <Screen title="내 티켓" subtitle="모아둔 관람 기록" header={<CatAvatar size={56} />}>
      {SAMPLE.map((t) => <TicketCard key={t.id} ticket={t} />)}
    </Screen>
  );
}
