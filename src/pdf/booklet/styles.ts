import { StyleSheet } from "@react-pdf/renderer";
import { BNI_GREY, BNI_RED } from "@/lib/constants";

export const bookletStyles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    fontSize: 8.5,
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
    fontSize: 15,
    fontWeight: "bold",
    color: BNI_RED,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 8,
    color: BNI_GREY,
    textAlign: "center",
    marginBottom: 12,
  },
  table: {
    borderLeft: "1px solid #cfcfcf",
    borderRight: "1px solid #cfcfcf",
    borderTop: "1px solid #cfcfcf",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    borderBottom: "1px solid #cfcfcf",
  },
  tableHeaderCell: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRight: "1px solid #dedede",
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: BNI_RED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e4e4e4",
    minHeight: 96,
    alignItems: "stretch",
  },
  guestBodyRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e4e4e4",
    minHeight: 44,
    alignItems: "stretch",
  },
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRight: "1px solid #e4e4e4",
    justifyContent: "flex-start",
  },
  photoColumn: {
    alignItems: "center",
    gap: 6,
  },
  headshot: {
    width: 46,
    height: 46,
    borderRadius: 2,
    objectFit: "cover",
  },
  headshotPlaceholder: {
    backgroundColor: "#efefef",
    border: "1px solid #dddddd",
  },
  linkedInBlock: {
    alignItems: "center",
    gap: 3,
  },
  linkedInQr: {
    width: 40,
    height: 40,
  },
  linkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  linkedInLabel: {
    fontSize: 6.5,
    color: "#0A66C2",
    fontWeight: "bold",
  },
  linkedInMissing: {
    alignItems: "center",
    gap: 2,
    opacity: 0.45,
  },
  linkedInMissingText: {
    fontSize: 6,
    color: BNI_GREY,
  },
  memberName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
    lineHeight: 1.25,
  },
  memberSeat: {
    fontSize: 8.5,
    color: BNI_RED,
    fontWeight: "bold",
    marginBottom: 3,
    lineHeight: 1.25,
  },
  memberRoles: {
    fontSize: 7.5,
    color: BNI_GREY,
    lineHeight: 1.35,
  },
  companyName: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
    lineHeight: 1.25,
  },
  contactList: {
    gap: 3,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactIcon: {
    width: 10,
    alignItems: "center",
  },
  contactText: {
    fontSize: 7.5,
    color: "#333333",
    lineHeight: 1.25,
    flex: 1,
  },
  contactLink: {
    textDecoration: "none",
    color: "#333333",
  },
  notesCell: {
    borderRight: "none",
    paddingVertical: 10,
  },
  notesLines: {
    gap: 7,
    marginTop: 2,
  },
  noteLine: {
    borderBottom: "1px solid #cccccc",
    height: 12,
  },
  guestWriteLine: {
    borderBottom: "1px solid #cccccc",
    height: 14,
    marginTop: 8,
  },
});
