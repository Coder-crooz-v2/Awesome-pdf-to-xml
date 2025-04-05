import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, 
  FileText,
  LogOut, 
  Menu,
  FileCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/theme/ModeToggle";
import { toast } from "sonner";
import { logoutUser } from "@/redux/slices/authSlice";
import { resetDocuments } from "@/redux/slices/documentSlice";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  {
    title: "PDF Files",
    icon: FileText,
    tab: "pdfs",
  },
  {
    title: "XML Files",
    icon: FileCode,
    tab: "xmls",
  },
  {
    title: "History",
    icon: BarChart,
    tab: "history",
  }
];

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }: SidebarProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    try {
      
      await dispatch(logoutUser()).unwrap();
      
      dispatch(resetDocuments());
      
      localStorage.removeItem("accessToken");
      
      toast.success("Logout successful");
      
      
      
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 100);
    } catch (error) {
      toast.error("Logout failed. Please try again");
      console.error("Logout error:", error);
    }
  };

  return (
    <div
      className={cn(
        "border-r bg-background h-screen flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center p-4 justify-between">
        {isOpen ? (
          <>
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5" />
            <span>PDF to XML</span>
          </Link>
          <ModeToggle />
          </>
        ) : (
          <FileText className="h-5 w-5 mx-auto" />
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = item.tab === activeTab || !activeTab;
            
            return item.tab ? (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-muted"
                )}
                onClick={() => setActiveTab(item.tab)}
              >
                <item.icon className={cn("h-5 w-5", isOpen ? "mr-2" : "mx-auto")} />
                {isOpen && <span>{item.title}</span>}
              </Button>
            ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-muted"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isOpen ? "mr-2" : "mx-auto")} />
                  {isOpen && <span>{item.title}</span>}
                </Button>
            );
          })}
        </div>
      </ScrollArea>
      
      <Separator />
      
      <div className={cn("p-4", isOpen ? "block" : "hidden")}>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user?.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
      
      <div className={cn("p-4", !isOpen && "flex justify-center")}>
        <Button
          variant="ghost"
          className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950")}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-5 w-5", isOpen ? "mr-2" : "mx-auto")} />
          {isOpen && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;