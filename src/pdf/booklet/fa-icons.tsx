import { Path, Svg } from "@react-pdf/renderer";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import {
  faFaceSmile,
  faGraduationCap,
  faHandshake,
  faHandshakeAngle,
  faHeart,
  faLightbulb,
  faLightbulbOn,
  faShieldCheck,
  faStar,
  faTrophy,
  faUserGroup,
} from "@fortawesome/pro-duotone-svg-icons";
import { BNI_RED } from "@/lib/constants";
import {
  resolveCoreValueIconKey,
  type CoreValueIconKey,
} from "@/lib/core-values";

type FaIconProps = {
  icon: IconDefinition;
  size?: number;
  color?: string;
};

const CORE_VALUE_FA_ICONS: Record<CoreValueIconKey, IconDefinition> = {
  "handshake-angle": faHandshakeAngle,
  "lightbulb-on": faLightbulbOn,
  "user-group": faUserGroup,
  "shield-check": faShieldCheck,
  "graduation-cap": faGraduationCap,
  "face-smile": faFaceSmile,
  trophy: faTrophy,
  heart: faHeart,
  handshake: faHandshake,
  star: faStar,
  lightbulb: faLightbulb,
};

export function FaDuotoneIcon({
  icon,
  size = 26,
  color = BNI_RED,
}: FaIconProps) {
  const [width, height, , , paths] = icon.icon;
  const [secondaryPath, primaryPath] = paths;
  const maxDim = Math.max(width, height);
  const padX = (maxDim - width) / 2;
  const padY = (maxDim - height) / 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-padX} ${-padY} ${maxDim} ${maxDim}`}
    >
      <Path d={secondaryPath} fill={color} fillOpacity={0.4} />
      <Path d={primaryPath} fill={color} />
    </Svg>
  );
}

export function CoreValueFaIcon({
  iconKey,
  size = 26,
  color = BNI_RED,
}: {
  iconKey: string;
  size?: number;
  color?: string;
}) {
  const resolvedKey = resolveCoreValueIconKey(iconKey);
  const icon =
    CORE_VALUE_FA_ICONS[resolvedKey] ?? CORE_VALUE_FA_ICONS.star;

  return <FaDuotoneIcon icon={icon} size={size} color={color} />;
}
