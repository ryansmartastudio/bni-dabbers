import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { TEAMS } from "@/lib/workshop/config";
import { PDF_FONT_FAMILY } from "@/pdf/fonts";

const RED = "#CF2030";
const INK = "#171412";
const MUTED = "#5C5752";
const BORDER = "#DDD4C8";
const GOLD = "#C9A227";

type PosterProps = {
  joinUrl: string;
  chapterLogoUrl: string | null;
  qrDataUrl: string;
};

/**
 * A4 poster for the front of the room. Deliberately sparse: at four metres the
 * only things that matter are the code, the URL as a fallback, and the one rule
 * people get wrong.
 */
export function WorkshopPoster({ joinUrl, chapterLogoUrl, qrDataUrl }: PosterProps) {
  const display = joinUrl.replace(/^https?:\/\//, "");

  return (
    <Document title="BNI Dabbers Growth Workshop — scan to join">
      <Page
        size="A4"
        style={{
          fontFamily: PDF_FONT_FAMILY,
          backgroundColor: "#FFFFFF",
          paddingTop: 0,
          paddingBottom: 36,
          paddingHorizontal: 44,
        }}
      >
        <View style={{ height: 10, backgroundColor: RED, marginHorizontal: -44 }} />

        <View style={{ alignItems: "center", marginTop: 28 }}>
          {chapterLogoUrl ? (
            <Image src={chapterLogoUrl} style={{ height: 46, objectFit: "contain" }} />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: 700, color: RED }}>BNI DABBERS</Text>
          )}
          <Text
            style={{
              marginTop: 10,
              fontSize: 9,
              letterSpacing: 2.2,
              color: MUTED,
              fontWeight: 700,
            }}
          >
            GROWTH WORKSHOP
          </Text>
        </View>

        <Text
          style={{
            marginTop: 18,
            fontSize: 34,
            fontWeight: 700,
            color: INK,
            textAlign: "center",
            letterSpacing: -0.6,
          }}
        >
          Who should we invite?
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          Scan with your phone camera to add the people you could invite as visitors.
        </Text>

        <View style={{ alignItems: "center", marginTop: 18 }}>
          <View style={{ borderWidth: 3, borderColor: INK, borderRadius: 10, padding: 10 }}>
            <Image src={qrDataUrl} style={{ width: 230, height: 230 }} />
          </View>
          <Text style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: INK }}>
            {display}
          </Text>
          <Text style={{ marginTop: 3, fontSize: 9, color: MUTED }}>
            Or type that into your browser
          </Text>
        </View>

        <View
          style={{
            marginTop: 18,
            borderWidth: 2,
            borderColor: RED,
            backgroundColor: "#FDECEE",
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#A51A26", textAlign: "center" }}>
            People outside BNI only — please don&apos;t add members of Dabbers
            or any other BNI chapter.
          </Text>
        </View>

        <Text
          style={{
            marginTop: 20,
            fontSize: 9,
            letterSpacing: 1.8,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          PICK YOUR POWER TEAM
        </Text>

        <View style={{ flexDirection: "row", gap: 7, marginTop: 7 }}>
          {TEAMS.map((team) => (
            <View
              key={team.id}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: BORDER,
                borderTopWidth: 4,
                borderTopColor: team.accent,
                borderRadius: 6,
                paddingVertical: 8,
                paddingHorizontal: 7,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
                {team.name}
              </Text>
              <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 3 }}>5 key seats</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 16,
            borderWidth: 2,
            borderColor: GOLD,
            backgroundColor: "#FFF6D6",
            borderRadius: 8,
            paddingVertical: 9,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: 700, color: INK, textAlign: "center" }}>
            Seat already full? Keep going — every extra name scores TRIPLE POINTS.
          </Text>
        </View>

        <Text
          style={{
            position: "absolute",
            bottom: 18,
            left: 44,
            right: 44,
            fontSize: 7.5,
            color: MUTED,
            textAlign: "center",
          }}
        >
          BNI Dabbers · Cheshire East · Growth Workshop
        </Text>
      </Page>
    </Document>
  );
}
