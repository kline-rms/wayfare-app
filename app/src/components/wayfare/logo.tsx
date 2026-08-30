// Wayfare "route-W" logo — an amber dashed route drawing a W, with a coral
// destination dot. Ported 1:1 from app-preview.html (Map-first splash).
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function Logo({ size = 88, plate = true }: { size?: number; plate?: boolean }) {
  const svg = (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x={4} y={4} width={56} height={56} rx={18} fill="#17123A" />
      <Path
        d="M14 22 L22 44 L32 26 L42 44 L50 22"
        fill="none"
        stroke="#FFA828"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 7"
      />
      <Circle cx={50} cy={22} r={4.5} fill="#FF4667" />
    </Svg>
  );
  if (!plate) return svg;
  return (
    <View
      style={{
        borderRadius: size * 0.24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        shadowColor: '#7C5CF6',
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      }}>
      {svg}
    </View>
  );
}
