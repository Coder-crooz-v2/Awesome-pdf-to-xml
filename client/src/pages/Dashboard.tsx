import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchUserDocuments,
  uploadDocument,
  deleteDocument
} from "@/redux/slices/documentSlice";
import { addToHistory, updateConversionHistory } from "@/redux/slices/userSlice";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Sidebar from "@/components/dashboard/Sidebar";
import FileUploader from "@/components/dashboard/FileUploader";

import { pdfToXml } from "@/lib/pdfConversion";
import {
  ChevronDown,
  Download,
  File,
  FileText,
  Loader2,
  Trash2,
  Upload,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import FileViewer from "@/components/dashboard/FileViewer";

declare global {
  interface FileConstructor {
    new(bits: BlobPart[], name: string, options?: FilePropertyBag): File;
  }
}

interface Document {
  _id: string;
  originalName: string;
  type: "pdf" | "xml";
  url: string;
  owner: string;
  createdAt: string;
}

interface ConversionHistoryItem {
  pdfName: string;
  xmlName: string;
  date: string;
  success: boolean;
}

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState<Document | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("pdfs");
  const [conversion, setConversion] = useState({
    inProgress: false,
    progress: 0,
    error: null as string | null,
    result: null as string | null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<Document | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const { documents, loading } = useSelector((state: RootState) => state.documents);
  const { user } = useSelector((state: RootState) => state.user);

  
  const pdfDocuments = documents.filter(doc => doc.type === "pdf");
  const xmlDocuments = documents.filter(doc => doc.type === "xml");

  
  const groupedHistory = useMemo(() => {
    
    if (!user?.history || !Array.isArray(user.history)) {
      return {};
    }

    
    const groups = user.history.reduce((groups: Record<string, ConversionHistoryItem[]>, item) => {
      const date = format(new Date(item.date), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});

    
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return groups;
  }, [user?.history]);

  useEffect(() => {
    dispatch(fetchUserDocuments());
  }, [dispatch]);

  const handleFileSelect = (file: Document) => {
    setSelectedFile(file);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await dispatch(uploadDocument(formData)).unwrap();
      toast.success("File Uploaded", {
        description: "Your file has been uploaded successfully.",
      });
    } catch (error) {
      toast.error("Upload Failed", {
        description: "There was an error uploading your file.",
      });
    }
  };

  const handleDeleteFile = (file: Document) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (fileToDelete) {
      try {
        await dispatch(deleteDocument(fileToDelete._id)).unwrap();
        if (selectedFile && selectedFile._id === fileToDelete._id) {
          setSelectedFile(null);
        }
        toast.success("File Deleted", {
          description: "The file has been deleted successfully.",
        });
      } catch (error) {
        toast.error("Delete Failed", {
          description: "There was an error deleting the file.",
        });
      }
    }
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleConvertPdf = async () => {
    if (!selectedFile || selectedFile.type !== "pdf") {
      toast("Conversion Error", {
        description: "Please select a PDF file to convert.",
      });
      return;
    }

    setConversion({
      inProgress: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      
      const response = await fetch(selectedFile.url);
      const pdfBlob = await response.blob();
      const pdfArrayBuffer = await pdfBlob.arrayBuffer();

      
      const xmlContent = await pdfToXml(pdfArrayBuffer, (progress) => {
        setConversion(prev => ({
          ...prev,
          progress: Math.round(progress * 100)
        }));
      });

      
      const xmlBlob = new Blob([xmlContent], { type: "application/xml" });

      
      const formData = new FormData();

      formData.append("file", xmlBlob, `${selectedFile.originalName.replace(/\.pdf$/, "")}.xml`);

      const uploadResult = await dispatch(uploadDocument(formData)).unwrap();

      
      const historyItem = {
        pdfName: selectedFile.originalName,
        xmlName: uploadResult.originalName,
        date: new Date().toISOString(),
        success: true
      };

      dispatch(addToHistory(historyItem));
      dispatch(updateConversionHistory(historyItem));

      setConversion({
        inProgress: false,
        progress: 100,
        error: null,
        result: xmlContent
      });

      toast("Conversion complete", {
        description: "PDF has been successfully converted to XML and uploaded.",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      setConversion({
        inProgress: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        result: null
      });
      dispatch(updateConversionHistory({
        pdfName: selectedFile.originalName,
        xmlName: "Conversion Failed",
        date: new Date().toISOString(),
        success: false
      }))
      toast.error("Conversion Failed", {
        description: "There was an error converting the PDF. You can try downloading the PDF and converting it locally.",
      });
    }
  };

  const downloadFile = async (file: Document) => {
    try {
      const response = await axios.get(file.url, { responseType: 'blob' });
      const blob = new Blob([response.data as BlobPart]);

      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();

      
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Download Failed", {
        description: "There was an error downloading the file.",
      });
    }
  };

  const downloadConvertedXml = () => {
    if (!conversion.result) return;

    const blob = new Blob([conversion.result], { type: "application/xml" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${selectedFile?.originalName.replace(/\.pdf$/, "")}.xml`;
    document.body.appendChild(a);
    a.click();

    
    URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 overflow-auto px-6">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <FileUploader onFileUpload={handleFileUpload} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>PDF Files</CardTitle>
                <CardDescription>
                  {pdfDocuments.length} total files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pdfDocuments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>XML Files</CardTitle>
                <CardDescription>
                  {xmlDocuments.length} total files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{xmlDocuments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Conversions</CardTitle>
                <CardDescription>
                  {user?.history?.length} total conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.history?.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="md:h-full h-content">
                <CardHeader>
                  <CardTitle>{activeTab === "pdfs" ? "PDF Files" : activeTab === "xmls" ? "XML Files" : "Conversion History"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="pdfs">PDFs</TabsTrigger>
                      <TabsTrigger value="xmls">XMLs</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pdfs" className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : pdfDocuments.length > 0 ? (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pdfDocuments.map((doc) => (
                                <TableRow
                                  key={doc._id}
                                  className={selectedFile?._id === doc._id ? "bg-muted" : ""}
                                  onClick={() => handleFileSelect(doc)}
                                >
                                  <TableCell className="font-medium flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" />
                                    <span className="truncate max-w-[150px]">
                                      {doc.originalName}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadFile(doc);
                                        }}
                                      >
                                        <Download size={16} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFile(doc);
                                        }}
                                      >
                                        <Trash2 size={16} className="text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No PDF files</h3>
                          <p className="text-muted-foreground">
                            Upload a PDF file to get started
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="xmls" className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : xmlDocuments.length > 0 ? (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {xmlDocuments.map((doc) => (
                                <TableRow
                                  key={doc._id}
                                  className={selectedFile?._id === doc._id ? "bg-muted" : ""}
                                  onClick={() => handleFileSelect(doc)}
                                >
                                  <TableCell className="font-medium flex items-center gap-2">
                                    <File size={16} className="text-green-500" />
                                    <span className="truncate max-w-[150px]">
                                      {doc.originalName}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadFile(doc);
                                        }}
                                      >
                                        <Download size={16} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFile(doc);
                                        }}
                                      >
                                        <Trash2 size={16} className="text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-4">
                          <File className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No XML files</h3>
                          <p className="text-muted-foreground">
                            Convert a PDF to XML to get started
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                      {(user?.history || []).length > 0 ? (
                        <ScrollArea className="h-[500px]">
                          {Object.entries(groupedHistory || {})
                            
                            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                            .map(([date, items]) => (
                              <Collapsible key={date} className="mb-4">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                                  <span className="font-medium">
                                    {format(new Date(date), "MMMM d, yyyy")}
                                  </span>
                                  <ChevronDown size={16} />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-4 mt-2 space-y-2">
                                  {/* Items within each date are already sorted */}
                                  {items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                      <div>
                                        <p className="text-sm">
                                          {item.success ?
                                            format(new Date(item.date), "h:mm a") + '-' + item.pdfName + ' converted to XML' :
                                            format(new Date(item.date), "h:mm a") + '-' + item.pdfName + ' conversion failed'
                                          }
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Result: {item.xmlName}
                                        </p>
                                      </div>
                                      <Badge variant={item.success ? "default" : "destructive"}>
                                        {item.success ? "Success" : "Failed"}
                                      </Badge>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No conversion history</h3>
                          <p className="text-muted-foreground">
                            Convert a PDF to XML to see your history
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    {selectedFile ? selectedFile.originalName : "File Preview"}
                  </CardTitle>
                  {selectedFile && (
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {selectedFile.type.toUpperCase()}
                      </Badge>
                      <div className="space-x-2">
                        {selectedFile.type === "pdf" && (
                          <Button
                            onClick={handleConvertPdf}
                            disabled={conversion.inProgress}
                          >
                            {conversion.inProgress ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Converting...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Convert to XML
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => downloadFile(selectedFile)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedFile ? (
                    <div className="space-y-4">
                      {conversion.inProgress && (
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Converting PDF to XML...</span>
                            <span>{conversion.progress}%</span>
                          </div>
                          <Progress value={conversion.progress} />
                        </div>
                      )}

                      {conversion.error && (
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                          <div className="flex items-start">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <div>
                              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Conversion Failed
                              </h3>
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {conversion.error}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => setConversion(prev => ({ ...prev, error: null }))}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {conversion.result && selectedFile.type === "pdf" && (
                        <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                            Conversion Complete
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                            The conversion was successful and the XML file has been uploaded.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadConvertedXml}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download XML
                          </Button>
                        </div>
                      )}

                      <FileViewer file={selectedFile} />
                    </div>
                  ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No file selected</h3>
                      <p className="text-muted-foreground max-w-md">
                        Select a file from the list to preview it here. You can convert PDF files to XML format.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium">{fileToDelete?.originalName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;