import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { BNI_GREY, BNI_RED } from "@/lib/constants";
import type { CoreValueIconKey } from "@/lib/core-values";

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

function GiftIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={10} width={16} height={10} rx={1} fill={color} />
      <Path d="M12 10V20M4 10h16M8.5 6.5C7 6.5 6 7.5 6 9s1.5 2.5 3 2.5h3V8H9c-1 0-1.5-.5-1.5-1.5S8 6.5 9 6.5h3V10M15.5 6.5C17 6.5 18 7.5 18 9s-1.5 2.5-3 2.5h-3V8h3c1 0 1.5-.5 1.5-1.5S16 6.5 15 6.5h-3V10" fill={color} />
    </Svg>
  );
}

function LandmarkIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5" fill={color} />
    </Svg>
  );
}

function UsersIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM3 20v-1a5 5 0 0110 0v1M11 19v-1a5 5 0 0110 0v1" fill={color} />
    </Svg>
  );
}

function ClipboardCheckIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 3h6l1 2h3v16H5V5h3l1-2zm1 11l2 2 4-4" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function BookOpenIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6c2 0 4-1 6-1s4 1 6 1v12c-2-1-4-2-6-2s-4 1-6 2V6zm8 0c2 0 4-1 6-1v12c-2-1-4-2-6-2" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function SunIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} fill={color} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function HeartIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" fill={color} />
    </Svg>
  );
}

function HandshakeIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12l3-3 4 4 5-5 4 4v5H4v-5z" fill={color} />
    </Svg>
  );
}

function StarIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l2.6 5.8 6.3.5-4.8 4.1 1.5 6.1L12 17.8 6.4 19.5l1.5-6.1L3 9.3l6.3-.5L12 3z" fill={color} />
    </Svg>
  );
}

function LightbulbIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18h6M10 21h4M12 3a6 6 0 014 10c-.8.8-1 1.5-1 2h-6c0-.5-.2-1.2-1-2a6 6 0 014-10z" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function TrophyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 3h6v2.2a3 3 0 01-6 0V3zm-3 2H4v1.5a2.5 2.5 0 002.4 2.5M18 5h2v1.5a2.5 2.5 0 01-2.4 2.5M12 10.7a4.3 4.3 0 003.8-2.2H8.2a4.3 4.3 0 003.8 2.2zM10 14h4v2h1v3H9v-3h1v-2z"
        fill={color}
      />
    </Svg>
  );
}

const CORE_VALUE_ICON_MAP: Record<
  CoreValueIconKey,
  (props: IconProps) => ReactElement
> = {
  gift: GiftIcon,
  landmark: LandmarkIcon,
  users: UsersIcon,
  "clipboard-check": ClipboardCheckIcon,
  "book-open": BookOpenIcon,
  sun: SunIcon,
  trophy: TrophyIcon,
  heart: HeartIcon,
  handshake: HandshakeIcon,
  star: StarIcon,
  lightbulb: LightbulbIcon,
};

export function CoreValueIcon({
  iconKey,
  size = 14,
  color = BNI_RED,
}: {
  iconKey: string;
  size?: number;
  color?: string;
}) {
  const Icon =
    CORE_VALUE_ICON_MAP[iconKey as CoreValueIconKey] ?? StarIcon;
  return <Icon size={size} color={color} />;
}
