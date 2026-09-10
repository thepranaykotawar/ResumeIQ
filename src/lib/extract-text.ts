/**
 * Browser-only text extraction for .pdf and .docx resume files.
 * All heavy parsers are dynamically imported so they never enter the SSR bundle.
 */

export type ExtractProgress = (step: string) => void;

export async function extractResumeText(file: File, onProgress?: ExtractProgress): Promise<string> {
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".pdf")) {
      onProgress?.("Reading PDF document…");
      return await extractPdf(file);
    }

    if (name.endsWith(".docx")) {
      onProgress?.("Reading Word document…");
      return await extractDocx(file);
    }

    if (name.endsWith(".txt")) {
      return await file.text();
    }

    throw new Error("Unsupported file type. Upload a .pdf or .docx resume.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("is not a function")) {
      throw new Error("Failed to process the document format. Please try re-saving as a standard PDF/DOCX file.");
    }
    throw error;
  }
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  try {
    const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc =
      (workerModule as { default: string }).default || (workerModule as unknown as string);
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round((item.transform?.[5] ?? 0) as number);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line.trim());
        line = "";
      }
      line += `${item.str} `;
      lastY = y;
    }
    lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }

  return pages.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buffer = await file.arrayBuffer();
  const result = await (
    mammoth as unknown as {
      extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    }
  ).extractRawText({ arrayBuffer: buffer });
  return result.value.replace(/\n{3,}/g, "\n\n").trim();
}