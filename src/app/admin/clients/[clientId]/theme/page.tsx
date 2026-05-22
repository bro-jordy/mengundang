import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { ThemeEditor } from "@/components/cms/client/ThemeEditor";

interface Props {
  params: Promise<{ clientId: string }>;
}

const DEFAULT_THEME = {
  templateSlug: "dark",
  primaryColor: "#c4a07a",
  secondaryColor: "#242424",
  bgColor: "#1a1a1a",
  textColor: "#f0ece6",
  fontHeading: "Cormorant",
  fontBody: "IBM Plex Sans",
};

export default async function ThemePage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const theme = await prisma.theme.findUnique({ where: { clientId } });

  const initialTheme = theme
    ? {
        templateSlug: theme.templateSlug || "classic",
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        bgColor: theme.bgColor,
        textColor: theme.textColor,
        fontHeading: theme.fontHeading,
        fontBody: theme.fontBody,
      }
    : DEFAULT_THEME;

  return <ThemeEditor clientId={clientId} initialTheme={initialTheme} />;
}
