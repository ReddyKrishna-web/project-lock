import type { Metadata, Viewport } from "next";
import { Outfit, Inter_Tight } from "next/font/google";
import { ToastProvider } from "@/components/ui/toaster";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StudyPilot — Your AI-powered study co-pilot",
    template: "%s · StudyPilot",
  },
  description:
    "StudyPilot turns your syllabus, deadlines and available time into a personalized study plan that adapts as you progress.",
  applicationName: "StudyPilot",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e15" },
  ],
};

const themeScript = `
try {
  var stored = localStorage.getItem('sp-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored || 'system';
  var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  var root = document.documentElement;
  if (isDark) root.classList.add('dark');
  root.style.colorScheme = isDark ? 'dark' : 'light';
  window.__spTheme = theme;
  window.__spSetTheme = function (t) {
    localStorage.setItem('sp-theme', t);
    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', d);
    document.documentElement.style.colorScheme = d ? 'dark' : 'light';
    window.__spTheme = t;
  };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if ((window.__spTheme || 'system') === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    }
  });
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${interTight.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.variable} ${interTight.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
