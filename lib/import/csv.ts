/**
 * Careful RFC-4180-ish CSV parser (client-side; no dependency).
 *
 * Supports: quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, \r\n / \r / \n line endings, and a UTF-8 BOM.
 */

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

/** Strip a leading UTF-8 BOM. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Split CSV text into logical records. A record may span several physical
 * lines when a quoted field contains newlines.
 */
function splitRecords(text: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    fields.push(field);
    field = "";
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"') {
      // An opening quote is only special at the start of a field.
      if (field === "") {
        inQuotes = true;
      } else {
        field += ch;
      }
      i++;
    } else if (ch === ",") {
      pushField();
      i++;
    } else if (ch === "\r") {
      pushField();
      rows.push(fields);
      fields = [];
      i += text[i + 1] === "\n" ? 2 : 1;
    } else if (ch === "\n") {
      pushField();
      rows.push(fields);
      fields = [];
      i++;
    } else {
      field += ch;
      i++;
    }
  }

  // Trailing content without a final newline.
  if (field !== "" || fields.length > 0) {
    pushField();
    rows.push(fields);
  }

  return rows;
}

/**
 * Parse CSV text. Returns headers (first non-empty record) and data rows.
 * Trims whitespace around header names and cell values.
 */
export function parseCsv(text: string): ParsedCsv {
  const records = splitRecords(stripBom(text));
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = nonEmpty[0].map((h) => h.trim());
  const rows = nonEmpty.slice(1).map((r) => {
    const cells = r.map((c) => c.trim());
    // Pad short rows so every row has one cell per header.
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });
  return { headers, rows };
}
