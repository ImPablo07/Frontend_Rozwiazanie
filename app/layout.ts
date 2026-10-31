import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cocktail Club — Find your next favourite",
  description: "Discover cocktail recipes, explore ingredients and save your favourites.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
