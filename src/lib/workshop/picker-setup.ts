/**
 * How to switch on Safari's Contact Picker API, by iOS version.
 *
 * Apple has moved this twice and renamed it once, and nobody is going to hunt
 * for it at 6:45am — so all three paths are printed and people pick the line
 * that matches their phone. Shared between the printed card and the page it
 * points at, so the two can never drift.
 *
 * Held as segments rather than one string because each surface joins them
 * differently: the PDF font has no arrow glyph and silently substitutes an
 * apostrophe for it, which turned "Settings → Apps" into "Settings 'Apps".
 */
export const IPHONE_STEPS: Array<{ version: string; path: string[] }> = [
  { version: "iOS 18 or newer", path: ["Settings", "Apps", "Safari", "Advanced", "Feature Flags"] },
  { version: "iOS 17", path: ["Settings", "Safari", "Advanced", "Feature Flags"] },
  { version: "iOS 16 or older", path: ["Settings", "Safari", "Advanced", "Experimental Features"] },
];

/** Where to find the iOS version, same treatment. */
export const IOS_VERSION_PATH = ["Settings", "General", "About", "iOS Version"];

/** Arrows the embedded PDF font can actually draw. */
export const PDF_ARROW = " > ";
export const WEB_ARROW = " → ";

/** Path on the workshop host, used on the poster and as the QR target. */
export const PICKER_CHECK_PATH = "/check";
