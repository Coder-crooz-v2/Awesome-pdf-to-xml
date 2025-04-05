import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4 flex-col justify-center">
        <div className="flex-col justify-center">
          <div className="space-y-4">
            <Link to="/" className="flex justify-center items-center gap-2 font-bold text-xl">
              <FileText className="h-6 w-6" />
              <span>PDFtoXML</span>
            </Link>
            <p className="text-muted-foreground text-sm text-center">
              Advanced document conversion with structure preservation.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} PDFtoXML. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;