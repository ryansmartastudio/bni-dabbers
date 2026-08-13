import { Image, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ChapterSettings, CoreValue } from "@/db/schema";
import type { CharityLinkWithQr } from "@/lib/charity-links";
import { normalizeCoreValues } from "@/lib/core-values";
import {
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
  MessageIcon,
} from "@/pdf/booklet/cover-icons";
import { CoreValueFaIcon } from "@/pdf/booklet/fa-icons";
import { bookletStyles as styles } from "@/pdf/booklet/styles";

type CoverPageProps = {
  settings: ChapterSettings;
  coreValues: CoreValue[];
  feedbackQrDataUrl?: string;
  chapterQrLink?: CharityLinkWithQr;
};

function DetailRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: string;
}) {
  return (
    <View style={styles.coverDetailRow}>
      <View style={styles.coverDetailIcon}>{icon}</View>
      <Text style={styles.coverDetailText}>{children}</Text>
    </View>
  );
}

function CoreValueCard({ value }: { value: CoreValue }) {
  return (
    <View style={styles.coreValueCard}>
      <View style={styles.coreValueHeader}>
        <View style={styles.coreValueIconWrap}>
          {value.iconUrl ? (
            <Image src={value.iconUrl} style={styles.coreValueCustomIcon} />
          ) : (
            <CoreValueFaIcon iconKey={value.iconKey} size={20} />
          )}
        </View>
        <Text style={styles.coreValueTitle}>{value.title}</Text>
      </View>
      <Text style={styles.coreValueDescription}>{value.description}</Text>
    </View>
  );
}

export function CoverPage({
  settings,
  coreValues,
  feedbackQrDataUrl,
  chapterQrLink,
}: CoverPageProps) {
  const values = normalizeCoreValues(coreValues);
  const feedbackLabel = settings.feedbackQrLabel?.trim() || "Feedback";

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverTopBar}>
        {settings.chapterLogoUrl ? (
          <Image src={settings.chapterLogoUrl} style={styles.coverChapterLogo} />
        ) : (
          <View style={styles.coverLogoPlaceholder} />
        )}
        {settings.venueLogoUrl ? (
          <Image src={settings.venueLogoUrl} style={styles.coverVenueLogo} />
        ) : (
          <View style={styles.coverLogoPlaceholder} />
        )}
      </View>

      <View style={styles.coverHero}>
        <Text style={styles.coverEyebrow}>Cheshire East · BNI</Text>
        <Text style={styles.coverTitle}>
          Welcome to {settings.chapterName}
        </Text>
        {chapterQrLink ? (
          <View style={styles.coverChapterQrBadge}>
            <Image src={chapterQrLink.qrDataUrl} style={styles.coverChapterQr} />
            <Text style={styles.coverChapterQrTitle}>{chapterQrLink.label}</Text>
          </View>
        ) : (
          <View style={styles.coverWebsiteRow}>
            <GlobeIcon size={10} />
            <Text style={styles.coverWebsite}>{settings.websiteUrl}</Text>
          </View>
        )}
      </View>

      <View style={styles.coverVenueCard}>
        {settings.venuePhotoUrl ? (
          <Image src={settings.venuePhotoUrl} style={styles.coverVenuePhoto} />
        ) : (
          <View style={styles.coverVenuePhotoPlaceholder}>
            <MapPinIcon size={18} />
            <Text style={styles.coverVenuePhotoPlaceholderText}>Venue photo</Text>
          </View>
        )}
        <View style={styles.coverVenueDetails}>
          <Text style={styles.coverVenueLabel}>Meeting at</Text>
          <DetailRow icon={<MapPinIcon size={10} />}>
            {settings.venueName}
          </DetailRow>
          <DetailRow icon={<MapPinIcon size={10} color="#888" />}>
            {settings.venueAddress}
          </DetailRow>
          <DetailRow icon={<CalendarIcon size={10} />}>
            {`${settings.meetingDay}s`}
          </DetailRow>
          <DetailRow icon={<ClockIcon size={10} />}>
            {`${settings.meetingStart} – ${settings.meetingEnd}`}
          </DetailRow>
        </View>
      </View>

      <View style={styles.coverCoreValuesSection}>
        <Text style={styles.coverSectionTitle}>BNI Core Values</Text>
        <View style={styles.coreValuesGrid}>
          {values.map((value) => (
            <CoreValueCard key={value.id} value={value} />
          ))}
        </View>
      </View>

      {feedbackQrDataUrl ? (
        <View style={styles.feedbackBadge}>
          <Image src={feedbackQrDataUrl} style={styles.feedbackQr} />
          <View style={styles.feedbackCopy}>
            <View style={styles.feedbackTitleRow}>
              <MessageIcon size={11} />
              <Text style={styles.feedbackTitle}>{feedbackLabel}</Text>
            </View>
            <Text style={styles.feedbackSubtitle}>
              Scan to share your meeting feedback with the chapter
            </Text>
          </View>
        </View>
      ) : null}
    </Page>
  );
}
