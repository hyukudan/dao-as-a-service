import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/lib/web3/providers";

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
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
