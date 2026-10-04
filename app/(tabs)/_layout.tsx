import { Tabs } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../src/theme';

type IconProps = { color: string };
const s = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const icons: Record<string, (p: IconProps) => React.ReactElement> = {
  shop: ({ color }) => (<Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 8h14l-1 12H6z" stroke={color} {...s} /><Path d="M9 8a3 3 0 016 0" stroke={color} {...s} /></Svg>),
  explore: ({ color }) => (<Svg width={24} height={24} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={7} stroke={color} {...s} /><Path d="M20 20l-4-4" stroke={color} {...s} /></Svg>),
  community: ({ color }) => (<Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M4 5h16v11H9l-5 4z" stroke={color} {...s} /></Svg>),
  tickets: ({ color }) => (<Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M3 7h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z" stroke={color} {...s} /></Svg>),
  more: ({ color }) => (<Svg width={24} height={24} viewBox="0 0 24 24"><Rect x={4} y={4} width={6} height={6} rx={1.5} stroke={color} {...s} /><Rect x={14} y={4} width={6} height={6} rx={1.5} stroke={color} {...s} /><Rect x={4} y={14} width={6} height={6} rx={1.5} stroke={color} {...s} /><Rect x={14} y={14} width={6} height={6} rx={1.5} stroke={color} {...s} /></Svg>),
};

const tabs = [
  { name: 'index', title: '둘러보기', icon: 'explore' },
  { name: 'community', title: '커뮤니티', icon: 'community' },
  { name: 'tickets', title: '내 티켓', icon: 'tickets' },
  { name: 'shop', title: '냥냥상점', icon: 'shop' },
  { name: 'more', title: '더보기', icon: 'more' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tabs.map((t) => {
        const Icon = icons[t.icon];
        return <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon color={String(color)} /> }} />;
      })}
    </Tabs>
  );
}
