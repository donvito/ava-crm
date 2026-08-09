import "../styles.css";

export const metadata = {
  title: "Folio CRM",
  description:
    "Folio CRM keeps relationships, follow-up tasks, and deal pipeline in one focused workspace.",
};

export const viewport = {
  themeColor: "#173f35",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
