import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegisure — Control and audit plane for AI coding agents",
  description: "See, govern, and remember everything every AI coding agent does across vendors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
