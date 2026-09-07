import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Media & Document Compressor — Image, Video, PDF & Audio',
  description:
    'Compress, optimize, and convert Images, Videos, PDF Documents, and Audio directly in your browser. 100% private with zero server uploads.',
  keywords: [
    'image compressor',
    'video compressor',
    'pdf compressor',
    'audio compressor',
    'mp3 compressor',
    'webp converter',
    'client-side media optimizer',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
