import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
}

const FileUploader = ({ onFileUpload }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      
      if (!(selectedFile.type === "application/pdf" || 
            selectedFile.type === "application/xml" || 
            selectedFile.name.endsWith(".pdf") || 
            selectedFile.name.endsWith(".xml"))) {
        toast.error("Invalid file type", {
          description: "Please upload a PDF or XML file.",
        });
        return;
      }
      
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "File size should be less than 10MB.",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      
      if (!(droppedFile.type === "application/pdf" || 
            droppedFile.type === "application/xml" || 
            droppedFile.name.endsWith(".pdf") || 
            droppedFile.name.endsWith(".xml"))) {
        toast.error("Invalid file type",{
          description: "Please upload a PDF or XML file.",
        });
        return;
      }
      
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "File size should be less than 10MB.",
        });
        return;
      }
      
      setFile(droppedFile);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      await onFileUpload(file);
      setFile(null);
      setDialogOpen(false);
      
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a PDF file to convert to XML or upload an XML file directly.
          </DialogDescription>
        </DialogHeader>
        <div 
          className="grid w-full gap-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">Drag and drop your file</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xml,application/pdf,application/xml"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
            >
              Browse Files
            </Label>
          </div>
          
          {file && (
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-md">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload File</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploader;