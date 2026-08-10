import { StyleSheet } from "@react-pdf/renderer";
import { BNI_GREY, BNI_RED } from "@/lib/constants";

export const bookletStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111111",
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 120,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontSize: 11,
    textAlign: "center",
    color: BNI_GREY,
    marginTop: 16,
    lineHeight: 1.5,
  },
  coverAccent: {
    fontSize: 12,
    textAlign: "center",
    color: BNI_RED,
    marginTop: 24,
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 8,
  },
  body: {
    fontSize: 9,
    color: BNI_GREY,
    lineHeight: 1.4,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #ececec",
    paddingVertical: 4,
  },
  roleTitle: {
    fontWeight: "bold",
    width: "45%",
  },
  roleName: {
    width: "55%",
  },
  qrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  qrItem: {
    alignItems: "center",
    width: "30%",
  },
  qrImage: {
    width: 64,
    height: 64,
  },
  qrLabel: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 4,
  },
  boxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  memberBox: {
    width: "48%",
    border: "1px solid #d9d9d9",
    padding: 8,
    minHeight: 180,
    marginBottom: 4,
  },
  memberBoxHeader: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  headshot: {
    width: 42,
    height: 42,
    backgroundColor: "#f5f5f5",
  },
  memberName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  memberCompany: {
    fontSize: 8,
    color: BNI_GREY,
  },
  memberSeat: {
    fontSize: 8,
    color: BNI_RED,
    fontWeight: "bold",
    marginTop: 2,
  },
  contactLine: {
    fontSize: 7.5,
    marginBottom: 2,
  },
  notesArea: {
    marginTop: 6,
    borderTop: "1px solid #ececec",
    paddingTop: 4,
    minHeight: 36,
  },
  notesLabel: {
    fontSize: 7,
    color: BNI_GREY,
    marginBottom: 2,
  },
  ruledLine: {
    borderBottom: "1px solid #ececec",
    height: 10,
    marginBottom: 2,
  },
  slotBox: {
    border: "1px solid #d9d9d9",
    padding: 10,
    minHeight: 80,
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 12,
    textAlign: "center",
  },
});
