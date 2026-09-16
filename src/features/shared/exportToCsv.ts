export interface CsvColumn<Row> {
  key: keyof Row & string;
  label: string;
}

type WorkbookFile = {
  data: Uint8Array;
  path: string;
};

const textEncoder = new TextEncoder();
const crcTable = createCrcTable();

export function exportRowsToCsv<Row extends Record<string, unknown>>(
  rows: readonly Row[],
  columns: readonly CsvColumn<Row>[],
  filename: string,
) {
  const worksheetXml = buildWorksheetXml(rows, columns);
  const workbookBlob = createXlsxWorkbookBlob(worksheetXml);
  const url = URL.createObjectURL(workbookBlob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = ensureExcelFilename(filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function createXlsxWorkbookBlob(worksheetXml: string) {
  const files: WorkbookFile[] = [
    {
      path: "[Content_Types].xml",
      data: encodeText(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    },
    {
      path: "_rels/.rels",
      data: encodeText(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      path: "xl/workbook.xml",
      data: encodeText(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Export" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`),
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      data: encodeText(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    },
    {
      path: "xl/styles.xml",
      data: encodeText(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`),
    },
    {
      path: "xl/worksheets/sheet1.xml",
      data: encodeText(worksheetXml),
    },
  ];

  return new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function buildWorksheetXml<Row extends Record<string, unknown>>(
  rows: readonly Row[],
  columns: readonly CsvColumn<Row>[],
) {
  const headerCells = columns.map((column, columnIndex) =>
    createInlineStringCell(columnIndex, 1, column.label, 1),
  );
  const bodyRows = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const cells = columns.map((column, columnIndex) =>
      createInlineStringCell(
        columnIndex,
        rowNumber,
        formatExcelValue(row[column.key]),
      ),
    );

    return `<row r="${rowNumber}">${cells.join("")}</row>`;
  });
  const columnDefinitions = columns
    .map(
      (column, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${getColumnWidth(
          column.label,
          rows.map((row) => formatExcelValue(row[column.key])),
        )}" customWidth="1"/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${columnDefinitions}</cols>
  <sheetData>
    <row r="1">${headerCells.join("")}</row>
    ${bodyRows.join("")}
  </sheetData>
</worksheet>`;
}

function createInlineStringCell(
  columnIndex: number,
  rowNumber: number,
  value: string,
  styleIndex = 0,
) {
  const cellReference = `${getExcelColumnName(columnIndex)}${rowNumber}`;

  return `<c r="${cellReference}" t="inlineStr" s="${styleIndex}"><is><t>${escapeXml(
    value,
  )}</t></is></c>`;
}

function createZip(files: readonly WorkbookFile[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const fileName = encodeText(file.path);
    const crc = getCrc32(file.data);
    const localHeader = createLocalFileHeader(fileName, file.data, crc);
    const centralHeader = createCentralDirectoryHeader(
      fileName,
      file.data,
      crc,
      offset,
    );

    localParts.push(localHeader, file.data);
    centralParts.push(centralHeader);
    offset += localHeader.length + file.data.length;
  });

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const endRecord = createEndOfCentralDirectoryRecord(
    files.length,
    centralDirectorySize,
    centralDirectoryOffset,
  );

  return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
}

function createLocalFileHeader(
  fileName: Uint8Array,
  data: Uint8Array,
  crc: number,
) {
  const header = new Uint8Array(30 + fileName.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, getDosTime(), true);
  view.setUint16(12, getDosDate(), true);
  view.setUint32(14, crc, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, fileName.length, true);
  view.setUint16(28, 0, true);
  header.set(fileName, 30);

  return header;
}

function createCentralDirectoryHeader(
  fileName: Uint8Array,
  data: Uint8Array,
  crc: number,
  offset: number,
) {
  const header = new Uint8Array(46 + fileName.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, getDosTime(), true);
  view.setUint16(14, getDosDate(), true);
  view.setUint32(16, crc, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(28, fileName.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(fileName, 46);

  return header;
}

function createEndOfCentralDirectoryRecord(
  fileCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function concatUint8Arrays(parts: readonly Uint8Array[]) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

function formatExcelValue(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value);
}

function ensureExcelFilename(filename: string) {
  const sanitizedFilename = filename.trim() || "export";

  if (/\.xlsx$/i.test(sanitizedFilename)) {
    return sanitizedFilename;
  }

  return `${sanitizedFilename.replace(/\.(csv|xls)$/i, "")}.xlsx`;
}

function getColumnWidth(header: string, values: readonly string[]) {
  const maxLength = [header, ...values].reduce(
    (length, value) => Math.max(length, value.length),
    0,
  );

  return Math.min(Math.max(maxLength + 2, 12), 38);
}

function getExcelColumnName(columnIndex: number) {
  let index = columnIndex + 1;
  let columnName = "";

  while (index > 0) {
    const remainder = (index - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    index = Math.floor((index - 1) / 26);
  }

  return columnName;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodeText(value: string) {
  return textEncoder.encode(value);
}

function getCrc32(data: Uint8Array) {
  let crc = 0xffffffff;

  data.forEach((byte) => {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]!;
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    return value >>> 0;
  });
}

function getDosTime() {
  const now = new Date();

  return (
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2)
  );
}

function getDosDate() {
  const now = new Date();

  return (
    ((now.getFullYear() - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate()
  );
}
