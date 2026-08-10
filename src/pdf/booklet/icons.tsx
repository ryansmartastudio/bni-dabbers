import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";
import { BNI_GREY } from "@/lib/constants";

type IconProps = {
  size?: number;
  color?: string;
};

export function EmailIcon({ size = 9, color = BNI_GREY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm0 2v.2l8 5 8-5V8H4z"
        fill={color}
      />
    </Svg>
  );
}

export function PhoneIcon({ size = 9, color = BNI_GREY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8.5 3.5c.4-.9 1.5-1.2 2.3-.6l1.6 1.2c.7.5.9 1.4.5 2.1l-.8 1.4c1.2 2.2 3.1 4.1 5.3 5.3l1.4-.8c.7-.4 1.6-.2 2.1.5l1.2 1.6c.6.8.3 1.9-.6 2.3-1 .4-2.1.6-3.2.6-5.8 0-10.5-4.7-10.5-10.5 0-1.1.2-2.2.6-3.2z"
        fill={color}
      />
    </Svg>
  );
}

export function WebsiteIcon({ size = 9, color = BNI_GREY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
      <Path
        d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6-3.8 9s1.3 6.2 3.8 9"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
    </Svg>
  );
}

export function LinkedInMark({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width={24} height={24} rx={4} fill="#0A66C2" />
      <Path
        fill="#FFFFFF"
        d="M7.4 9.2h2.7v9H7.4V9.2zm1.35-4.3a1.55 1.55 0 110 3.1 1.55 1.55 0 010-3.1zM11.9 9.2h2.6v1.2h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.14v4.84h-2.7v-4.3c0-1.02-.02-2.33-1.34-2.33-1.3 0-1.5 1.02-1.5 2.07v4.56h-2.7V9.2h2.46z"
      />
    </Svg>
  );
}