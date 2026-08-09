import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "../../../app/ui/Nav";
import "../../../app/ui/styles.css";

export const metadata: Metadata = {
  title: "AVA CRM",
  description: "CRM with companies, contacts and a deal pipeline",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
