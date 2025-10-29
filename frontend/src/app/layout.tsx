import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAO-as-a-Service | Create and Manage DAOs",
  description: "No-code platform for creating and managing complex DAOs on Attelyx Chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
