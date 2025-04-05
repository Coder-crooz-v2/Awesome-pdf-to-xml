import * as pdfjsLib from 'pdfjs-dist';
import { XMLBuilder } from 'fast-xml-parser';
interface TextItem {
  str: string;
  transform: number[];
  [key: string]: any;
}

console.log(pdfjsLib.version)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

/**
 * Convert a PDF file to XML format
 * @param pdfData ArrayBuffer containing the PDF data
 * @param progressCallback Function to report conversion progress
 * @returns Promise that resolves to XML string
 */
export async function pdfToXml(
  pdfData: ArrayBuffer,
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    
    
    if (progressCallback) {
    loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
      const percent = progress.loaded / progress.total;
      progressCallback(percent * 0.2); 
    };
    }
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    
    const xmlStructure = {
      document: {
        "@_name": "PDF Document",
        metadata: {
          createdAt: new Date().toISOString(),
          pages: numPages
        },
        pages: {
          page: [] as any[]
        }
      }
    };
    
    
    for (let i = 1; i <= numPages; i++) {
      if (progressCallback) {
        
        progressCallback(0.2 + (i - 1) / numPages * 0.8);
      }
      
      const page = await pdfDocument.getPage(i);
      const pageContent = await processPage(page);
      
      xmlStructure.document.pages.page.push({
        "@_number": i,
        ...pageContent
      });
    }
    
    
    const builder = new XMLBuilder({ 
      format: true,
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const xmlOutput = builder.build(xmlStructure);
    
    
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlOutput}`;
    
    
    if (progressCallback) {
      progressCallback(1);
    }
    
    return xmlString;
  } catch (error) {
    console.error("PDF to XML conversion error:", error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Process a PDF page and extract its content structure
 * @param page PDF.js Page object
 * @returns Structured content of the page
 */
async function processPage(page: pdfjsLib.PDFPageProxy): Promise<any> {
  const textContent = await page.getTextContent();
  const pageContent: any = {};
  
  
  const { paragraphs, tables, lists } = extractStructuredContent(textContent.items as TextItem[], page.view);
  
  
  pageContent.content = {
    paragraph: paragraphs,
    table: tables.length > 0 ? tables : undefined,
    list: lists.length > 0 ? lists : undefined
  };
  
  return pageContent;
}

/**
 * Extract structured content from PDF text items
 * @param items Array of text items from PDF.js
 * @param pageView PDF page view information
 * @returns Structured content organized into paragraphs, tables, and lists
 */
function extractStructuredContent(
  items: TextItem[],
  pageView: number[]
): { paragraphs: string[]; tables: any[]; lists: any[] } {
  
  const lines = groupItemsByLines(items);
  
  
  const paragraphs: string[] = [];
  const tables: any[] = [];
  const lists: any[] = [];
  
  
  let currentParagraph = "";
  
  
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const text = line.map((item: TextItem) => item.str).join(" ").trim();
    
    
    if (!text) {
      lineIndex++;
      continue;
    }
    
    
    if (isPotentialTable(line, pageView)) {
      
      const tableResult = extractTable(lines, lineIndex);
      if (tableResult.table) {
        
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = "";
        }
        
        tables.push(tableResult.table);
        lineIndex = tableResult.nextLineIndex;
        continue;
      }
    }
    
    
    if (isPotentialListItem(text)) {
      
      const listResult = extractList(lines, lineIndex);
      if (listResult.list) {
        
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = "";
        }
        
        lists.push(listResult.list);
        lineIndex = listResult.nextLineIndex;
        continue;
      }
    }
    
    
    if (currentParagraph && isSentenceEnd(currentParagraph)) {
      
      paragraphs.push(currentParagraph);
      currentParagraph = text;
    } else {
      
      currentParagraph = currentParagraph 
        ? `${currentParagraph} ${text}` 
        : text;
    }
    
    lineIndex++;
  }
  
  
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }
  
  return { paragraphs, tables, lists };
}

/**
 * Group text items into lines based on y-position
 * @param items Array of text items from PDF.js
 * @returns Array of lines, each containing text items
 */
function groupItemsByLines(items: TextItem[]): TextItem[][] {
  
  const sortedItems = [...items].sort((a, b) => {
    if (Math.abs(a.transform[5] - b.transform[5]) < 2) {
      return a.transform[4] - b.transform[4]; 
    }
    return b.transform[5] - a.transform[5]; 
  });
  
  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [];
  let currentY: number | null = null;
  
  
  for (const item of sortedItems) {
    const y = item.transform[5];
    
    if (currentY === null || Math.abs(y - currentY) < 2) {
      
      currentLine.push(item);
      currentY = y;
    } else {
      
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [item];
      currentY = y;
    }
  }
  
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Check if a line potentially belongs to a table
 * @param line Array of text items in a line
 * @param pageView PDF page view information
 * @returns Boolean indicating if the line might be part of a table
 */
function isPotentialTable(line: TextItem[], pageView: number[]): boolean {
  
  if (line.length < 2) return false;
  
  
  const xPositions = line.map(item => item.transform[4]);
  const pageWidth = pageView[2];
  console.log(pageWidth)
  
  
  const gaps = [];
  for (let i = 1; i < xPositions.length; i++) {
    gaps.push(xPositions[i] - xPositions[i-1]);
  }
  
  
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const gapConsistency = gaps.every(gap => Math.abs(gap - avgGap) < avgGap * 0.5);
  
  
  return gapConsistency && line.length >= 3;
}

/**
 * Extract table structure from lines
 * @param lines Array of lines
 * @param startIndex Index to start extraction from
 * @returns Table structure and next line index
 */
function extractTable(
  lines: TextItem[][],
  startIndex: number
): { table: any | null; nextLineIndex: number } {
  const potentialHeaderLine = lines[startIndex];
  const headerItems = potentialHeaderLine.map(item => item.str.trim());
  
  
  const columnPositions = potentialHeaderLine.map(item => item.transform[4]);
  
  
  const rows = [];
  let lineIndex = startIndex;
  let consecutiveNonTableLines = 0;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    
    if (isTableRow(line, columnPositions)) {
      
      const cells = extractTableCells(line, columnPositions);
      rows.push({ "@_index": rows.length, cell: cells });
      consecutiveNonTableLines = 0;
    } else {
      consecutiveNonTableLines++;
      
      
      if (consecutiveNonTableLines > 1) {
        break;
      }
    }
    
    lineIndex++;
  }
  
  
  if (rows.length < 2) {
    return { table: null, nextLineIndex: startIndex + 1 };
  }
  
  
  const table = {
    "@_rows": rows.length,
    "@_columns": columnPositions.length,
    header: {
      cell: headerItems
    },
    row: rows
  };
  
  return { table, nextLineIndex: lineIndex };
}

/**
 * Check if a line matches table row structure
 * @param line Array of text items in a line
 * @param columnPositions Array of x-positions for columns
 * @returns Boolean indicating if the line is a table row
 */
function isTableRow(line: TextItem[], columnPositions: number[]): boolean {
  
  if (line.length === 0) return false;
  
  
  const xPositions = line.map(item => item.transform[4]);
  
  
  let matchingColumns = 0;
  for (const xPos of xPositions) {
    for (const colPos of columnPositions) {
      if (Math.abs(xPos - colPos) < 10) { 
        matchingColumns++;
        break;
      }
    }
  }
  
  
  return matchingColumns >= Math.min(xPositions.length, columnPositions.length) / 2;
}

/**
 * Extract table cells from a line based on column positions
 * @param line Array of text items in a line
 * @param columnPositions Array of x-positions for columns
 * @returns Array of cell texts
 */
function extractTableCells(line: TextItem[], columnPositions: number[]): string[] {
  const cells: string[] = [];
  
  
  for (let i = 0; i < columnPositions.length; i++) {
    cells.push("");
  }
  
  
  for (const item of line) {
    const x = item.transform[4];
    let columnIndex = 0;
    
    
    for (let i = 1; i < columnPositions.length; i++) {
      if (x < columnPositions[i] - 5) { 
        break;
      }
      columnIndex = i;
    }
    
    
    cells[columnIndex] += (cells[columnIndex] ? " " : "") + item.str;
  }
  
  
  return cells.map(cell => cell.trim());
}

/**
 * Check if text appears to be a list item
 * @param text Text to check
 * @returns Boolean indicating if the text is likely a list item
 */
function isPotentialListItem(text: string): boolean {
  
  if (/^\d+\./.test(text)) return true;
  
  
  if (/^[•\-\*]/.test(text)) return true;
  
  
  if (/^[a-z]\./.test(text)) return true;
  
  return false;
}

/**
 * Extract list structure from lines
 * @param lines Array of lines
 * @param startIndex Index to start extraction from
 * @returns List structure and next line index
 */
function extractList(
  lines: TextItem[][],
  startIndex: number
): { list: any | null; nextLineIndex: number } {
  const items: string[] = [];
  let lineIndex = startIndex;
  let listType = "unordered";
  
  
  const firstLine = lines[startIndex];
  const firstLineText = firstLine.map(item => item.str).join(" ").trim();
  
  if (/^\d+\./.test(firstLineText)) {
    listType = "ordered";
  }
  
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const text = line.map(item => item.str).join(" ").trim();
    
    if (isPotentialListItem(text)) {
      
      const item = text.replace(/^[\d\.\-•\*][\.:]?\s*/, "");
      items.push(item);
    } else {
      
      const indent = line[0]?.transform[4] || 0;
      const prevLineIndent = lineIndex > 0 
        ? lines[lineIndex - 1][0]?.transform[4] || 0 
        : 0;
      
      if (Math.abs(indent - prevLineIndent) < 10 && items.length > 0) {
        
        items[items.length - 1] += " " + text;
      } else {
        
        break;
      }
    }
    
    lineIndex++;
  }
  
  
  if (items.length < 2) {
    return { list: null, nextLineIndex: startIndex + 1 };
  }
  
  
  const list = {
    "@_type": listType,
    item: items
  };
  
  return { list, nextLineIndex: lineIndex };
}

/**
 * Check if text appears to end a sentence
 * @param text Text to check
 * @returns Boolean indicating if the text ends a sentence
 */
function isSentenceEnd(text: string): boolean {
  return /[.!?]$/.test(text.trim());
}

/**
 * Save XML content to a file
 * @param xmlContent XML content as string
 * @param filename Name for the saved file
 */
export function saveXmlToFile(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Extract document metadata from PDF
 * @param pdfData ArrayBuffer containing the PDF data
 * @returns Promise that resolves to metadata object
 */
export async function extractPdfMetadata(pdfData: ArrayBuffer): Promise<any> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdfDocument = await loadingTask.promise;
      const metadata = await pdfDocument.getMetadata();
      
      
      const info = metadata.info as any;
      
      const pdfDocumentAny = pdfDocument as any;
      
      return {
        title: info && info.Title ? info.Title : 'Untitled Document',
        author: info && info.Author ? info.Author : 'Unknown Author',
        numPages: pdfDocument.numPages,
        
        isEncrypted: pdfDocumentAny.isEncrypted !== undefined ? pdfDocumentAny.isEncrypted : false,
      };
    } catch (error) {
      console.error("Error extracting PDF metadata:", error);
      return {
        title: 'Untitled Document',
        author: 'Unknown Author',
        numPages: 0,
        isEncrypted: false,
      };
    }
}