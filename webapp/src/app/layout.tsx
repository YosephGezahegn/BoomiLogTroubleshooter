import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './components.css';
import Header from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Boomi Log Analysis Platform',
  description: 'Analyze Dell Boomi integration logs with advanced parsing and visualization',
  keywords: ['Boomi', 'integration', 'log analysis', 'troubleshooting', 'monitoring'],
  authors: [{ name: 'Yoseph Alemu' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.variable}>
        <Header />
        {children}
      </body>
    </html>
  );
}
