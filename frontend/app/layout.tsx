import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "竞品研究助手",
  description: "AI 驱动的竞品分析工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}