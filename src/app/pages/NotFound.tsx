import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-3xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
