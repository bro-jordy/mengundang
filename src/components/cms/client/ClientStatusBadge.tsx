import { ClientStatus } from "@/types/prisma.types";
import { cn } from "@/lib/utils";

const styles: Record<ClientStatus, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  ARCHIVED: "bg-stone-50 text-stone-500 border-stone-200",
};

const labels: Record<ClientStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  ARCHIVED: "Arsip",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "text-xs border rounded-full px-2 py-0.5 font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
