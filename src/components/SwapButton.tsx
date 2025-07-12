import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SwapButtonProps {
  className?: string;
}

export const SwapButton = ({ className = "" }: SwapButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/swap')}
      className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
    >
      <ArrowLeftRight className="h-5 w-5 mr-2" />
      SWAP
    </Button>
  );
};