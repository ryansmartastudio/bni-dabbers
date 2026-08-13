import path from "node:path";
import { Font } from "@react-pdf/renderer";

const fontsDir = path.join(process.cwd(), "src/pdf/fonts");

Font.register({
  family: "Figtree",
  fonts: [
    {
      src: path.join(fontsDir, "Figtree-Regular.woff"),
      fontWeight: 400,
    },
    {
      src: path.join(fontsDir, "Figtree-Bold.woff"),
      fontWeight: 700,
    },
  ],
});

export const PDF_FONT_FAMILY = "Figtree";
