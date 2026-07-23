import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "HGBC Influencers - Church Management System",
  description: "Sermon and Church Management Dashboard",
  icons: {
    icon: "https://res.cloudinary.com/yttbshx3/image/upload/v1782975092/icon_logo_kajuv5.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
