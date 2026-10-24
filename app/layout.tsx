import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Document to Action — Team 10",
  description:
    "Turn administrative notices into actionable, traceable checklists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
