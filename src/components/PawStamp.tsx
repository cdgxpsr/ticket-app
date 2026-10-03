import Svg, { Ellipse } from 'react-native-svg';
import { colors } from '../theme';

export function PawStamp({ size = 28, color = colors.accent, rotate = -12 }: { size?: number; color?: string; rotate?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Ellipse cx={20} cy={26} rx={10} ry={8.5} fill={color} />
      <Ellipse cx={9} cy={15} rx={4} ry={5} fill={color} />
      <Ellipse cx={16} cy={9} rx={4} ry={5} fill={color} />
      <Ellipse cx={24} cy={9} rx={4} ry={5} fill={color} />
      <Ellipse cx={31} cy={15} rx={4} ry={5} fill={color} />
    </Svg>
  );
}
