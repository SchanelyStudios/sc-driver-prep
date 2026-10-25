import type { Metadata } from "next";
import "./globals.css";
const styles = {
  html: "antialiased",
  body: "min-h-dvh",
  skip: "sr-only z-50 rounded-lg bg-brand px-4 py-3 text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
};
export const metadata: Metadata = {
  title: "SC Driver Prep — Your road to ready",
  description:
    "Study the South Carolina driver's manual with guided questions, section reviews, and a comprehensive practice test.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={styles.html}>
      <body className={styles.body}>
        <a href="#main-content" className={styles.skip}>
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
