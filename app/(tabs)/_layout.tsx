import { Tabs } from 'expo-router';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../src/theme';

type IconProps = { color: string };
const s = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const icons: Record<string, (p: IconProps) => React.ReactElement> = {
  // Same paw as the app logo.
  shop: ({ color }) => (<Svg width={24} height={24} viewBox="-50 -56 100 100"><Ellipse cx={-34} cy={-18} rx={10} ry={12} fill={color} /><Ellipse cx={-13} cy={-38} rx={10.5} ry={13} fill={color} /><Ellipse cx={13} cy={-38} rx={10.5} ry={13} fill={color} /><Ellipse cx={34} cy={-18} rx={10} ry={12} fill={color} /><Path d="M0 -10c19 0 32 14 32 28 0 12-9 17-18 15-5-1-9-3-14-3s-9 2-14 3c-9 2-18-3-18-15 0-14 13-28 32-28z" fill={color} /></Svg>),
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
