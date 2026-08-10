import { Font } from "@react-pdf/renderer";

/** Keep words intact — react-pdf otherwise inserts hyphen breaks when wrapping text. */
export function noHyphenationCallback(word: string) {
  return [word];
}

Font.registerHyphenationCallback(noHyphenationCallback);
