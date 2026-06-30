import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { color: string; size?: number };

export function HomeIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StatsIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 21V10M12 21V4M19 21v-7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function StudyIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h11a2 2 0 0 1 2 2v14l-4-2-4 2-3-1.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6 4v13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ManageIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3} stroke={color} strokeWidth={2} />
      <Path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 20a5.5 5.5 0 0 0-3-4.9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function AccountIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={2} />
      <Path d="M5 20a7 7 0 0 1 14 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function RecordIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
