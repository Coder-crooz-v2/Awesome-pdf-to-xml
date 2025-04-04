import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../theme/ModeToggle";
import { FileText } from "lucide-react";

const Navbar = () => {
  return (
    <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <FileText className="h-6 w-6" />
          <span>PDFtoXML</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;