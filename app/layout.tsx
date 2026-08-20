import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anand Philip | Digital Marketing Executive",
  description: "The digital marketing portfolio of Anand Philip - SEO, content, social media, and analytics.",
  icons: {
    icon: "https://anand-philip-marketing-portfolio.round-egret-4062.chatgpt.site/favicon.svg",
    shortcut: "https://anand-philip-marketing-portfolio.round-egret-4062.chatgpt.site/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
