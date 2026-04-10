const fs = require("fs");
const path = require("path");

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 40;
const MARGIN_Y = 40;
const FONT_SIZE = 10;
const LINE_HEIGHT = 13;
const MAX_CHARS = 95;

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line, maxChars) {
  if (line.length <= maxChars) return [line];

  const leadingSpaces = line.match(/^\s*/)?.[0] ?? "";
  let remaining = line.trim();
  const wrapped = [];

  while (remaining.length > maxChars) {
    let splitIndex = remaining.lastIndexOf(" ", maxChars);
    if (splitIndex <= 0) splitIndex = maxChars;

    const chunk = remaining.slice(0, splitIndex).trimEnd();
    wrapped.push((wrapped.length === 0 ? leadingSpaces : leadingSpaces) + chunk);
    remaining = remaining.slice(splitIndex).trimStart();
  }

  wrapped.push((wrapped.length === 0 ? leadingSpaces : leadingSpaces) + remaining);
  return wrapped;
}

function textToLines(text) {
  const normalized = text.replace(/\r/g, "");
  const lines = [];

  for (const rawLine of normalized.split("\n")) {
    if (rawLine.length === 0) {
      lines.push("");
      continue;
    }

    const wrapped = wrapLine(rawLine, MAX_CHARS);
    for (const line of wrapped) {
      lines.push(line);
    }
  }

  return lines;
}

function linesToPages(lines) {
  const maxLinesPerPage = Math.floor((PAGE_HEIGHT - MARGIN_Y * 2) / LINE_HEIGHT);
  const pages = [];

  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }

  return pages;
}

function pageContentStream(lines) {
  const startX = MARGIN_X;
  const startY = PAGE_HEIGHT - MARGIN_Y;
  let stream = "BT\n";
  stream += `/F1 ${FONT_SIZE} Tf\n`;
  stream += `${LINE_HEIGHT} TL\n`;
  stream += `${startX} ${startY} Td\n`;

  lines.forEach((line, index) => {
    if (index > 0) stream += "T*\n";
    stream += `(${escapePdfText(line)}) Tj\n`;
  });

  stream += "ET\n";
  return stream;
}

function createPdfFromText(text, outputPath) {
  const lines = textToLines(text);
  const pages = linesToPages(lines.length ? lines : [""]);

  const objects = [];
  const fontObjectId = 3;
  let nextObjectId = 4;

  const pageObjectIds = [];
  const contentObjectIds = [];

  for (let i = 0; i < pages.length; i += 1) {
    pageObjectIds.push(nextObjectId);
    nextObjectId += 1;
    contentObjectIds.push(nextObjectId);
    nextObjectId += 1;
  }

  const maxObjectId = nextObjectId - 1;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;
  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  for (let i = 0; i < pages.length; i += 1) {
    const pageId = pageObjectIds[i];
    const contentId = contentObjectIds[i];
    const stream = pageContentStream(pages[i]);

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R ` +
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>`;

    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream`;
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let id = 1; id <= maxObjectId; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id <= maxObjectId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  fs.writeFileSync(outputPath, pdf, "utf8");
}

function run() {
  const docsDir = path.resolve(__dirname, "..", "docs");
  const sources = [
    {
      input: path.join(docsDir, "backend-handoff-guide.txt"),
      output: path.join(docsDir, "backend-handoff-guide.pdf"),
    },
    {
      input: path.join(docsDir, "postman-testing-guide.txt"),
      output: path.join(docsDir, "postman-testing-guide.pdf"),
    },
  ];

  for (const file of sources) {
    const content = fs.readFileSync(file.input, "utf8");
    createPdfFromText(content, file.output);
    console.log(`Generated: ${path.basename(file.output)}`);
  }
}

run();
