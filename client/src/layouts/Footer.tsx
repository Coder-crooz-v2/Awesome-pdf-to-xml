import { Link } from "react-router-dom";
import { FileText, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <FileText className="h-6 w-6" />
              <span>PDFtoXML</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Advanced document conversion with structure preservation.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
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