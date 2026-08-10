import { Image, Text, View } from "@react-pdf/renderer";
import type { ChapterSettings } from "@/db/schema";
import type { CharityLinkWithQr } from "@/lib/charity-links";
import { GENIE_WISH_BLUE, GENIE_WISH_GOLD } from "@/lib/charity-links";
import { bookletStyles as styles } from "@/pdf/booklet/styles";

type CharitySectionProps = {
  settings: ChapterSettings;
  links: CharityLinkWithQr[];
};

function CharityQrCard({ link }: { link: CharityLinkWithQr }) {
  return (
    <View style={styles.charityQrCard}>
      <View style={styles.charityQrFrame}>
        <Image src={link.qrDataUrl} style={styles.charityQrImage} />
      </View>
      <Text style={styles.charityQrLabel}>{link.label}</Text>
    </View>
  );
}

export function CharitySection({ settings, links }: CharitySectionProps) {
  const hasCharityContent =
    links.length > 0 ||
    Boolean(settings.charityParagraph) ||
    Boolean(settings.charityLogoUrl);
  const hasBankDetails =
    Boolean(settings.bniDabbersBankDetails) ||
    Boolean(settings.bniGlobalBankDetails);

  if (!hasCharityContent && !hasBankDetails) {
    return null;
  }

  return (
    <View style={styles.charitySectionRow}>
      {hasCharityContent ? (
        <View
          style={
            hasBankDetails
              ? styles.charityBadgeColumn
              : [styles.charityBadgeColumn, styles.charityColumnFull]
          }
        >
          <View style={styles.charityBadge}>
            <View style={styles.charityBadgeHeader}>
              <View style={styles.charityBadgeHeaderCopy}>
                <Text style={styles.charityBadgeEyebrow}>
                  Dabbers Chosen Charity
                </Text>
                <Text style={styles.charityBadgeTitle}>{settings.charityName}</Text>
              </View>
              {settings.charityLogoUrl ? (
                <Image
                  src={settings.charityLogoUrl}
                  style={styles.charityBadgeLogo}
                />
              ) : null}
            </View>

            {settings.charityParagraph ? (
              <Text style={styles.charityBadgeParagraph}>
                {settings.charityParagraph}
              </Text>
            ) : null}

            {links.length > 0 ? (
              <View style={styles.charityQrPanel}>
                <View style={styles.charityQrRow}>
                  {links.map((link) => (
                    <CharityQrCard key={link.id} link={link} />
                  ))}
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.charityBadgeAccent,
                { backgroundColor: GENIE_WISH_GOLD },
              ]}
            />
            <View
              style={[
                styles.charityBadgeSideAccent,
                { backgroundColor: GENIE_WISH_BLUE },
              ]}
            />
          </View>
        </View>
      ) : null}

      {hasBankDetails ? (
        <View
          style={
            hasCharityContent
              ? styles.charityBankColumn
              : [styles.charityBankColumn, styles.charityColumnFull]
          }
        >
          <View style={styles.charityBankBox}>
            <Text style={styles.charityBankBoxTitle}>Bank details</Text>
            <View style={styles.charityBankPanel}>
              {settings.bniDabbersBankDetails ? (
                <View style={styles.charityBankBlock}>
                  <Text style={styles.charityBankTitle}>BNI Dabbers</Text>
                  <Text style={styles.charityBankText}>
                    {settings.bniDabbersBankDetails}
                  </Text>
                </View>
              ) : null}
              {settings.bniGlobalBankDetails ? (
                <View style={styles.charityBankBlock}>
                  <Text style={styles.charityBankTitle}>BNI Global</Text>
                  <Text style={styles.charityBankText}>
                    {settings.bniGlobalBankDetails}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
