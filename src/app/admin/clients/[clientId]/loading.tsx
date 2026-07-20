import { Loader2 } from "lucide-react";

export default function ClientTabLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-stone-400">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}
