import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Горіховий клуб — горіхи та сухофрукти з доставкою по Дніпру",
  description:
    "Онлайн-магазин свіжих горіхів та сухофруктів у Дніпрі. Зручна фасовка, швидке оформлення замовлення, доставка по місту.",
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

