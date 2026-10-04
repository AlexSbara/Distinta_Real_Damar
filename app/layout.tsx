import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distinta 7 | Gestione squadra",
  description: "La tua rosa e le distinte di gara in PDF, pronte in pochi clic.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
