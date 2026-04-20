import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { ToastContainer } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${sora.variable} ${jetbrains.variable} font-sans text-white antialiased bg-[#0b1020]`}>
        <Providers>
          <Navigation />
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}

