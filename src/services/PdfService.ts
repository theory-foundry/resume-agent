import { RESUME } from "@/example-data/Resume";

type FontStyle = "normal" | "bold" | "italic" | "bolditalic";

type WriteTextOptions = {
  color?: [number, number, number];
  gapAfter?: number;
  indent?: number;
  size?: number;
  style?: FontStyle;
};

const PAGE_MARGIN = 42;
const BODY_TEXT_COLOR: [number, number, number] = [15, 23, 42];
const MUTED_TEXT_COLOR: [number, number, number] = [71, 85, 105];
const SECTION_TEXT_COLOR: [number, number, number] = [21, 94, 117];

function normalizeText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function toLines(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

export default class PdfService {
  async generateResumePdf(): Promise<Blob> {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      compress: true,
      format: "letter",
      orientation: "portrait",
      unit: "pt",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;

    let cursorY = PAGE_MARGIN;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY + requiredHeight <= pageHeight - PAGE_MARGIN) {
        return;
      }

      pdf.addPage();
      cursorY = PAGE_MARGIN;
    };

    const writeText = (text: string, options: WriteTextOptions = {}) => {
      const size = options.size ?? 11;
      const style = options.style ?? "normal";
      const indent = options.indent ?? 0;
      const gapAfter = options.gapAfter ?? 6;
      const color = options.color ?? BODY_TEXT_COLOR;
      const lines = toLines(pdf.splitTextToSize(normalizeText(text), contentWidth - indent));
      const lineHeight = size * 1.35;

      ensureSpace(lines.length * lineHeight);

      pdf.setFont("helvetica", style);
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      pdf.text(lines, PAGE_MARGIN + indent, cursorY);

      cursorY += lines.length * lineHeight + gapAfter;
    };

    const writeSectionTitle = (title: string) => {
      if (cursorY > PAGE_MARGIN) {
        cursorY += 6;
      }

      writeText(title.toUpperCase(), {
        color: SECTION_TEXT_COLOR,
        gapAfter: 7,
        size: 10,
        style: "bold",
      });
    };

    const writeBullet = (text: string) => {
      const bulletIndent = 10;
      const bulletMarkerX = PAGE_MARGIN + 2;
      const lineHeight = 10 * 1.4;
      const lines = toLines(pdf.splitTextToSize(normalizeText(text), contentWidth - bulletIndent));

      ensureSpace(lines.length * lineHeight);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...BODY_TEXT_COLOR);
      pdf.text(">", bulletMarkerX, cursorY);
      pdf.text(lines, PAGE_MARGIN + bulletIndent, cursorY);

      cursorY += lines.length * lineHeight + 1.4;
    };

    const writeExperience = () => {
      writeSectionTitle("Experience");

      for (const role of RESUME.experience) {
        ensureSpace(54);
        writeText(`${role.company} - ${role.title}`, {
          gapAfter: 3,
          size: 11,
          style: "bold",
        });
        writeText(role.period, {
          color: MUTED_TEXT_COLOR,
          gapAfter: 6,
          size: 10,
          style: "italic",
        });

        for (const highlight of role.highlights) {
          writeBullet(highlight);
        }

        cursorY += 22;
      }
    };

    const writeSkills = () => {
      writeSectionTitle("Skills");
      writeText(RESUME.skills.join(" • "), {
        gapAfter: 0,
      });
    };

    const writeProjects = () => {
      writeSectionTitle("Projects");

      for (const project of RESUME.projects) {
        ensureSpace(68);
        writeText(`${project.title} (${project.company})`, {
          gapAfter: 3,
          size: 11,
          style: "bold",
        });
        writeText(project.description, {
          gapAfter: -2,
          size: 10,
        });
        writeText(`Skills: ${project.skills.join(", ")}`, {
          color: MUTED_TEXT_COLOR,
          gapAfter: 1,
          size: 9,
        });
        writeText(`Link: ${project.link}`, {
          color: MUTED_TEXT_COLOR,
          gapAfter: 11,
          size: 9,
        });
      }
    };

    pdf.setProperties({
      author: RESUME.name,
      subject: `${RESUME.name} resume`,
      title: `${RESUME.name} Resume`,
    });

    writeText(RESUME.name, {
      color: SECTION_TEXT_COLOR,
      gapAfter: -7,
      size: 20,
      style: "bold",
    });
    writeText(RESUME.title, {
      color: MUTED_TEXT_COLOR,
      gapAfter: 5,
      size: 11,
      style: "bold",
    });

    writeText(`${RESUME.contact.website} | ${RESUME.contact.linkedin} | ${RESUME.contact.email} `, {
      color: MUTED_TEXT_COLOR,
      gapAfter: 10,
      size: 9,
    });

    writeSectionTitle("Summary");
    writeText(RESUME.summary, {
      gapAfter: 5,
    });

    writeExperience();
    writeProjects();
    writeSkills();

    return pdf.output("blob");
  }
}
