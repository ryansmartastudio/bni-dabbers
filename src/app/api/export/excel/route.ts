import { auth } from "@clerk/nextjs/server";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getAllMembers } from "@/lib/members";
import { getChapterSettings } from "@/lib/settings";
import { BNI_RED } from "@/lib/constants";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [members, settings] = await Promise.all([
    getAllMembers(),
    getChapterSettings(),
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Members");

  sheet.addRow([`${settings.chapterName} — Member Roster`]);
  sheet.mergeCells("A1:M1");
  sheet.getCell("A1").font = {
    bold: true,
    size: 14,
    color: { argb: BNI_RED.replace("#", "FF") },
  };

  sheet.addRow([
    "First Name",
    "Last Name",
    "Company",
    "BNI Seat",
    "Chapter Roles",
    "Role Group",
    "Email",
    "Phone",
    "Website URL",
    "LinkedIn URL",
    "Notes",
    "Status",
    "Sort Order",
  ]);

  const headerRow = sheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BNI_RED.replace("#", "FF") },
  };

  sheet.columns = [
    { width: 16 },
    { width: 16 },
    { width: 24 },
    { width: 20 },
    { width: 22 },
    { width: 14 },
    { width: 28 },
    { width: 16 },
    { width: 28 },
    { width: 32 },
    { width: 30 },
    { width: 12 },
    { width: 12 },
  ];

  members.forEach((member) => {
    sheet.addRow([
      member.firstName,
      member.lastName,
      member.company,
      member.bniSeat,
      member.chapterRoles.join(", "),
      member.roleGroup,
      member.email,
      member.phone,
      member.websiteUrl ?? "",
      member.linkedinUrl ?? "",
      member.notes ?? "",
      member.status,
      member.sortOrder,
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${settings.chapterName.replace(/\s+/g, "-")}-roster.xlsx"`,
    },
  });
}
