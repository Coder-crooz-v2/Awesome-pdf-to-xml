import * as pdfjsLib from 'pdfjs-dist';
import { XMLBuilder } from 'fast-xml-parser';
// @ts-ignore
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry.js";

// Define a custom interface for TextItem since pdfjsLib doesn't export it directly
interface TextItem {
  str: string;
  transform: number[];
  [key: string]: any;
}

// Initialize PDF.js worker
console.log(pdfjsLib.version)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

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
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    
    // Set up progress tracking
    if (progressCallback) {
    loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
      const percent = progress.loaded / progress.total;
      progressCallback(percent * 0.2); // First 20% is for loading the document
    };
    }
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    // Initialize XML structure
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
    
    // Process each page
    for (let i = 1; i <= numPages; i++) {
      if (progressCallback) {
        // Progress: 20% for loading + 80% for page processing
        progressCallback(0.2 + (i - 1) / numPages * 0.8);
      }
      
      const page = await pdfDocument.getPage(i);
      const pageContent = await processPage(page);
      
      xmlStructure.document.pages.page.push({
        "@_number": i,
        ...pageContent
      });
    }
    
    // Convert JSON structure to XML
    const builder = new XMLBuilder({ 
      format: true,
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const xmlOutput = builder.build(xmlStructure);
    
    // Add XML declaration
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlOutput}`;
    
    // Complete progress
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
  
  // Process text items to identify structure
  const { paragraphs, tables, lists } = extractStructuredContent(textContent.items as TextItem[], page.view);
  
  // Add content to page structure
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
  // Group items by y-position (lines)
  const lines = groupItemsByLines(items);
  
  // Initialize result containers
  const paragraphs: string[] = [];
  const tables: any[] = [];
  const lists: any[] = [];
  
  // Current paragraph text
  let currentParagraph = "";
  
  // Process lines to identify structure
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const text = line.map((item: TextItem) => item.str).join(" ").trim();
    
    // Skip empty lines
    if (!text) {
      lineIndex++;
      continue;
    }
    
    // Check if this is potentially a table by looking at item spacing
    if (isPotentialTable(line, pageView)) {
      // Extract table structure
      const tableResult = extractTable(lines, lineIndex);
      if (tableResult.table) {
        // Add current paragraph if any
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = "";
        }
        
        tables.push(tableResult.table);
        lineIndex = tableResult.nextLineIndex;
        continue;
      }
    }
    
    // Check if this is potentially a list item
    if (isPotentialListItem(text)) {
      // Extract list structure
      const listResult = extractList(lines, lineIndex);
      if (listResult.list) {
        // Add current paragraph if any
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = "";
        }
        
        lists.push(listResult.list);
        lineIndex = listResult.nextLineIndex;
        continue;
      }
    }
    
    // If we reach here, treat as paragraph text
    if (currentParagraph && isSentenceEnd(currentParagraph)) {
      // New paragraph
      paragraphs.push(currentParagraph);
      currentParagraph = text;
    } else {
      // Continue current paragraph
      currentParagraph = currentParagraph 
        ? `${currentParagraph} ${text}` 
        : text;
    }
    
    lineIndex++;
  }
  
  // Add final paragraph if any
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
  // Sort items by y-position and then x-position
  const sortedItems = [...items].sort((a, b) => {
    if (Math.abs(a.transform[5] - b.transform[5]) < 2) {
      return a.transform[4] - b.transform[4]; // Same line, sort by x
    }
    return b.transform[5] - a.transform[5]; // Sort by y (top to bottom)
  });
  
  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [];
  let currentY: number | null = null;
  
  // Group by y-position
  for (const item of sortedItems) {
    const y = item.transform[5];
    
    if (currentY === null || Math.abs(y - currentY) < 2) {
      // Same line
      currentLine.push(item);
      currentY = y;
    } else {
      // New line
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [item];
      currentY = y;
    }
  }
  
  // Add the last line
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
  // A table typically has evenly spaced items or specific patterns
  if (line.length < 2) return false;
  
  // Check for evenly spaced items (column-like)
  const xPositions = line.map(item => item.transform[4]);
  const pageWidth = pageView[2];
  console.log(pageWidth)
  
  // Simple heuristic: check if items are evenly spaced
  const gaps = [];
  for (let i = 1; i < xPositions.length; i++) {
    gaps.push(xPositions[i] - xPositions[i-1]);
  }
  
  // Check if gaps are relatively consistent
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const gapConsistency = gaps.every(gap => Math.abs(gap - avgGap) < avgGap * 0.5);
  
  // More sophisticated checks can be added here
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
  
  // Determine column positions from header
  const columnPositions = potentialHeaderLine.map(item => item.transform[4]);
  
  // Look for table rows
  const rows = [];
  let lineIndex = startIndex;
  let consecutiveNonTableLines = 0;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    // Check if this line matches the table structure
    if (isTableRow(line, columnPositions)) {
      // Extract cells based on column positions
      const cells = extractTableCells(line, columnPositions);
      rows.push({ "@_index": rows.length, cell: cells });
      consecutiveNonTableLines = 0;
    } else {
      consecutiveNonTableLines++;
      
      // If we've seen multiple consecutive non-table lines, assume we're out of the table
      if (consecutiveNonTableLines > 1) {
        break;
      }
    }
    
    lineIndex++;
  }
  
  // Only consider it a table if we have enough rows
  if (rows.length < 2) {
    return { table: null, nextLineIndex: startIndex + 1 };
  }
  
  // Create table structure
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
  // No items means not a table row
  if (line.length === 0) return false;
  
  // Get x-positions of items in this line
  const xPositions = line.map(item => item.transform[4]);
  
  // Count how many items align with column positions
  let matchingColumns = 0;
  for (const xPos of xPositions) {
    for (const colPos of columnPositions) {
      if (Math.abs(xPos - colPos) < 10) { // 10 is a tolerance value
        matchingColumns++;
        break;
      }
    }
  }
  
  // If at least half of the items align with columns, consider it a match
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
  
  // Initialize array with empty strings for each column
  for (let i = 0; i < columnPositions.length; i++) {
    cells.push("");
  }
  
  // Assign each text item to the appropriate column
  for (const item of line) {
    const x = item.transform[4];
    let columnIndex = 0;
    
    // Find which column this item belongs to
    for (let i = 1; i < columnPositions.length; i++) {
      if (x < columnPositions[i] - 5) { // 5 is a tolerance value
        break;
      }
      columnIndex = i;
    }
    
    // Add text to the appropriate column
    cells[columnIndex] += (cells[columnIndex] ? " " : "") + item.str;
  }
  
  // Trim each cell
  return cells.map(cell => cell.trim());
}

/**
 * Check if text appears to be a list item
 * @param text Text to check
 * @returns Boolean indicating if the text is likely a list item
 */
function isPotentialListItem(text: string): boolean {
  // Check for numbered list (e.g., "1.", "2.", etc.)
  if (/^\d+\./.test(text)) return true;
  
  // Check for bullet points
  if (/^[•\-\*]/.test(text)) return true;
  
  // Check for lettered list (e.g., "a.", "b.", etc.)
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
  
  // Get the text of the first line to determine list type
  const firstLine = lines[startIndex];
  const firstLineText = firstLine.map(item => item.str).join(" ").trim();
  
  if (/^\d+\./.test(firstLineText)) {
    listType = "ordered";
  }
  
  // Process lines until we find a non-list item
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const text = line.map(item => item.str).join(" ").trim();
    
    if (isPotentialListItem(text)) {
      // Strip the list marker
      const item = text.replace(/^[\d\.\-•\*][\.:]?\s*/, "");
      items.push(item);
    } else {
      // If the indent level is similar to list items, consider it part of the previous item
      const indent = line[0]?.transform[4] || 0;
      const prevLineIndent = lineIndex > 0 
        ? lines[lineIndex - 1][0]?.transform[4] || 0 
        : 0;
      
      if (Math.abs(indent - prevLineIndent) < 10 && items.length > 0) {
        // Append to the previous item
        items[items.length - 1] += " " + text;
      } else {
        // Not part of the list
        break;
      }
    }
    
    lineIndex++;
  }
  
  // Only consider it a list if we have multiple items
  if (items.length < 2) {
    return { list: null, nextLineIndex: startIndex + 1 };
  }
  
  // Create list structure
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
  
  // Clean up
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
      
      // Cast info to any to access properties safely
      const info = metadata.info as any;
      // Cast pdfDocument to any to access potentially missing properties
      const pdfDocumentAny = pdfDocument as any;
      
      return {
        title: info && info.Title ? info.Title : 'Untitled Document',
        author: info && info.Author ? info.Author : 'Unknown Author',
        numPages: pdfDocument.numPages,
        // Check if isEncrypted exists before accessing it
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