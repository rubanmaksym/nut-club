import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Горіховий клуб — купити горіхи та сухофрукти в Дніпрі",
  description:
    "Купити свіжі горіхи та сухофрукти у Дніпрі. Фундук, мигдаль, кешью, фініки, курага. Зручна фасовка 250/500/1000 г. Швидка доставка по місту. Замовляйте онлайн!",

  keywords: [
    "горіхи Дніпро",
    "сухофрукти Дніпро",
    "купити горіхи",
    "купити сухофрукти",
    "фундук Дніпро",
    "мигдаль купити",
    "доставка горіхів",
  ],

  openGraph: {
    title: "Горіховий клуб — горіхи та сухофрукти",
    description:
      "Свіжі горіхи та сухофрукти з доставкою по Дніпру. Замовляй онлайн.",
    url: "https://nut-club-ten.vercel.app",
    siteName: "Горіховий клуб",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "uk_UA",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}