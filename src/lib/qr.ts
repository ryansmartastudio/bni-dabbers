import QRCode from "qrcode";

export async function generateQrDataUrl(
  value: string,
  size = 200,
): Promise<string> {
  if (!value) return "";
  return QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    color: { dark: "#111111", light: "#ffffff" },
  });
}
