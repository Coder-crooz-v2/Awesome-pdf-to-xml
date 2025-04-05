import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface FileViewerProps {
  file: {
    _id: string;
    originalName: string;
    type: "pdf" | "xml";
    url: string;
  };
}

const FileViewer = ({ file }: FileViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  useEffect(() => {
    setLoading(true);
    setPageNumber(1);
    if (file.type === "xml") {
      fetchXmlContent();
    }

    
    return () => {
      setNumPages(null);
      setXmlContent(null);
    };
  }, [file]);

  const fetchXmlContent = async () => {
    try {
      const response = await fetch(file.url);
      const text = await response.text();
      setXmlContent(text);
    } catch (error) {
      console.error("Error fetching XML content:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber + 1 >= numPages! ? numPages! : pageNumber + 1);
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div className="flex flex-col h-full">
      {file.type === "pdf" ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={pageNumber.toString()}
                onValueChange={(value) => setPageNumber(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={pageNumber.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Array(numPages || 0), (_, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm">of {numPages}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={scale >= 2.5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
              {(<Document
                file={file.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error("Error loading PDF:", error);
                  setLoading(false);
                }}
                loading={
                  <div className="flex items-center justify-center h-[600px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-[600px] text-red-500 p-4">
                    <p className="mb-4">Failed to load PDF. The worker may not be available.</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      Open PDF in new tab
                    </Button>
                  </div>
                }
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
                }}
              >
                {numPages !== null && (
                  <Page
                    key={`page_${pageNumber}`}
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <Skeleton className="h-[600px] w-full" />
                    }
                  />
                )}
              </Document>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "rendered" | "raw")}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="rendered">Rendered</TabsTrigger>
                <TabsTrigger value="raw">Raw XML</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="rendered" className="h-[600px] overflow-auto">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Card className="p-4 h-[540px] overflow-auto bg-gray-50 dark:bg-gray-900">
                  {xmlContent ? (
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              body {
                                font-family: system-ui, -apple-system, sans-serif;
                                padding: 1rem;
                                color: #333;
                                line-height: 1.5;
                              }
                              pre {
                                background-color: #f5f5f5;
                                padding: 0.5rem;
                                border-radius: 0.25rem;
                                overflow: auto;
                              }
                              table {
                                border-collapse: collapse;
                                width: 100%;
                                margin-bottom: 1rem;
                              }
                              table, th, td {
                                border: 1px solid #e2e8f0;
                              }
                              th, td {
                                padding: 0.5rem;
                                text-align: left;
                              }
                              th {
                                background-color: #f8fafc;
                              }
                              @media (prefers-color-scheme: dark) {
                                body {
                                  background-color: #1a1a1a;
                                  color: #e2e8f0;
                                }
                                pre {
                                  background-color: #2d2d2d;
                                }
                                table, th, td {
                                  border-color: #4a4a4a;
                                }
                                th {
                                  background-color: #2d2d2d;
                                }
                              }
                            </style>
                          </head>
                          <body>
                            ${formatXmlAsHtml(xmlContent)}
                          </body>
                        </html>
                      `}
                      className="w-full h-full border-0"
                      title="XML Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No XML content available</p>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="raw" className="h-[600px] overflow-auto">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <SyntaxHighlighter
                  language="xml"
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{
                    height: "100%",
                    margin: 0,
                    borderRadius: "0.5rem",
                  }}
                >
                  {xmlContent || "No content available"}
                </SyntaxHighlighter>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};


function formatXmlAsHtml(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    
    const html = transformXmlToHtml(xmlDoc.documentElement);
    return html;
  } catch (error) {
    console.error("Error parsing XML:", error);
    return `<pre>${xmlString}</pre>`;
  }
}

function transformXmlToHtml(node: Element): string {
  let html = '';

  
  switch (node.nodeName.toLowerCase()) {
    case 'document':
      html += `<div class="document">`;
      if (node.hasAttribute('name')) {
        html += `<h1>${node.getAttribute('name')}</h1>`;
      }
      break;
    case 'page':
      html += `<div class="page">`;
      if (node.hasAttribute('number')) {
        html += `<h2>Page ${node.getAttribute('number')}</h2>`;
      }
      break;
    case 'paragraph':
      html += `<p>`;
      break;
    case 'table':
      html += `<table>`;
      break;
    case 'row':
      html += `<tr>`;
      break;
    case 'cell':
      html += `<td>`;
      break;
    case 'header':
      html += `<h3>`;
      break;
    case 'list':
      html += node.hasAttribute('type') && node.getAttribute('type') === 'ordered'
        ? `<ol>`
        : `<ul>`;
      break;
    case 'item':
      html += `<li>`;
      break;
    default:
      html += `<div class="${node.nodeName.toLowerCase()}">`;
  }

  
  if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
    html += node.textContent;
  } else {
    
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        html += transformXmlToHtml(child as Element);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          html += text;
        }
      }
    }
  }

  
  switch (node.nodeName.toLowerCase()) {
    case 'document':
    case 'page':
      html += `</div>`;
      break;
    case 'paragraph':
      html += `</p>`;
      break;
    case 'table':
      html += `</table>`;
      break;
    case 'row':
      html += `</tr>`;
      break;
    case 'cell':
      html += `</td>`;
      break;
    case 'header':
      html += `</h3>`;
      break;
    case 'list':
      html += node.hasAttribute('type') && node.getAttribute('type') === 'ordered'
        ? `</ol>`
        : `</ul>`;
      break;
    case 'item':
      html += `</li>`;
      break;
    default:
      html += `</div>`;
  }

  return html;
}

export default FileViewer;