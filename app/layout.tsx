import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "錯題收集 - WrongCollection",
  description: "輕鬆管理您的錯題本，學習路上的最佳夥伴",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
