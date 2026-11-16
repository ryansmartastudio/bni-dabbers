import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { TEAMS } from "@/lib/workshop/config";
import {
  IOS_VERSION_PATH,
  IPHONE_STEPS,
  PDF_ARROW,
} from "@/lib/workshop/picker-setup";
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
  /** Page two: where to check the setting actually took. */
  checkUrl: string;
  checkQrDataUrl: string;
};

/**
 * A4 poster for the front of the room. Deliberately sparse: at four metres the
 * only things that matter are the code, the URL as a fallback, and the one rule
 * people get wrong.
 */
export function WorkshopPoster({
  joinUrl,
  chapterLogoUrl,
  qrDataUrl,
  checkUrl,
  checkQrDataUrl,
}: PosterProps) {
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

      {/*
        Page two goes on the tables in the weeks before. A phone that can pull
        a name straight out of contacts adds people in seconds; one that can't
        is typing, and the difference across a room is most of a round.
      */}
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

        <View style={{ alignItems: "center", marginTop: 18 }}>
          {chapterLogoUrl ? (
            <Image src={chapterLogoUrl} style={{ height: 30, objectFit: "contain" }} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: 700, color: RED }}>BNI DABBERS</Text>
          )}
          <Text
            style={{
              marginTop: 9,
              fontSize: 9,
              letterSpacing: 2.2,
              color: MUTED,
              fontWeight: 700,
            }}
          >
            BEFORE THE WORKSHOP · TWO MINUTES
          </Text>
        </View>

        <Text
          style={{
            marginTop: 10,
            fontSize: 26,
            fontWeight: 700,
            color: INK,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          Two minutes now saves you typing
        </Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 10.5,
            color: MUTED,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          On the day you&apos;ll be adding people you could invite. iPhones can pull them
          straight from your contacts — but only once you switch this on. Most Android
          phones already can; Samsung Internet cannot, so Samsung owners should open the
          link in Chrome.
        </Text>

        <View
          style={{
            marginTop: 10,
            borderWidth: 1.5,
            borderColor: INK,
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 10.5, color: INK, lineHeight: 1.5 }}>
            <Text style={{ fontWeight: 700 }}>On a Samsung?</Text> Samsung Internet has no
            contact picker and no setting that adds one. Open the workshop link in Chrome on
            the same phone and it works in one tap. The steps below are iPhone only.
          </Text>
          <Text style={{ marginTop: 5, fontSize: 9.5, color: MUTED, lineHeight: 1.45 }}>
            And if none of this works on your phone, don&apos;t worry — you can still type
            names in on the day, which most people do anyway.
          </Text>
        </View>

        <Text
          style={{
            marginTop: 12,
            fontSize: 9,
            letterSpacing: 1.8,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          STEP 1 — FIND THE RIGHT MENU FOR YOUR iOS
        </Text>
        <Text style={{ marginTop: 4, fontSize: 9.5, color: MUTED }}>
          Check yours in {IOS_VERSION_PATH.join(PDF_ARROW)}.
        </Text>

        <View style={{ marginTop: 6, gap: 5 }}>
          {IPHONE_STEPS.map((group) => (
            <View
              key={group.version}
              style={{
                borderWidth: 1,
                borderColor: BORDER,
                borderLeftWidth: 4,
                borderLeftColor: RED,
                borderRadius: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.2, color: MUTED }}>
                {group.version.toUpperCase()}
              </Text>
              <Text style={{ marginTop: 3, fontSize: 12, fontWeight: 700, color: INK }}>
                {group.path.join(PDF_ARROW)}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            marginTop: 12,
            fontSize: 9,
            letterSpacing: 1.8,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          STEP 2 — SWITCH IT ON
        </Text>
        <View
          style={{
            marginTop: 5,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 11, color: INK, lineHeight: 1.55 }}>
            Scroll down that list to{" "}
            <Text style={{ fontWeight: 700 }}>Contact Picker API</Text> and turn it on. It is
            a long list and alphabetical. Then fully close Safari — swipe up from the bottom
            of the screen and flick Safari away.
          </Text>
          <Text style={{ marginTop: 6, fontSize: 9.5, color: MUTED, lineHeight: 1.5 }}>
            No Feature Flags? Look for Experimental Features in the same place — older iOS
            calls it that.
          </Text>
        </View>

        <Text
          style={{
            marginTop: 12,
            fontSize: 9,
            letterSpacing: 1.8,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          STEP 3 — CHECK IT WORKED
        </Text>

        <View
          style={{
            marginTop: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            borderWidth: 2,
            borderColor: INK,
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Image src={checkQrDataUrl} style={{ width: 100, height: 100 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.35 }}>
              Scan this and the page tells you straight away whether your phone is ready.
            </Text>
            <Text style={{ marginTop: 6, fontSize: 10.5, fontWeight: 700, color: RED }}>
              {checkUrl.replace(/^https?:\/\//, "")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 9, color: MUTED, lineHeight: 1.45 }}>
              It also repeats these steps, so you don&apos;t need to keep this card.
            </Text>
          </View>
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
