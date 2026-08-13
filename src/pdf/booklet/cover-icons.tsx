import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";
import { BNI_GREY, BNI_RED } from "@/lib/constants";

type IconProps = {
  size?: number;
  color?: string;
};

export function MapPinIcon({ size = 11, color = BNI_RED }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        fill={color}
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 11, color = BNI_RED }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={16} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M3 9h18M8 3v4M16 3v4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function ClockIcon({ size = 11, color = BNI_RED }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function GlobeIcon({ size = 11, color = BNI_GREY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} fill="none" />
      <Path
        d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6-3.8 9s1.3 6.2 3.8 9"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
      />
    </Svg>
  );
}

export function MessageIcon({ size = 11, color = "#ffffff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 4h16a1 1 0 011 1v10a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1z"
        fill={color}
      />
    </Svg>
  );
}

