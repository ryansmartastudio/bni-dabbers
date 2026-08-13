import { StyleSheet } from "@react-pdf/renderer";
import { BNI_GREY, BNI_RED } from "@/lib/constants";
import { PDF_FONT_FAMILY } from "@/pdf/fonts";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: "#111111",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: BNI_GREY,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e5e5",
    paddingVertical: 8,
    gap: 12,
  },
  cell: {
    flex: 1,
  },
  memberName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  muted: {
    color: BNI_GREY,
    fontSize: 9,
  },
  qr: {
    width: 48,
    height: 48,
  },
});
