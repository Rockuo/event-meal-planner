import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { ApolloProvider } from '@/hooks/context/ApolloProvider';
import LayoutStyle from '@/app/LayoutStyle';
import HandledUserContext from '@/hooks/context/HandledUserContext';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#ffffff',
};

export const metadata: Metadata = {
    metadataBase: new URL('https://nim-fawn.vercel.app/'),
    alternates: {
        canonical: '/',
    },
    title: {
        default: 'Nim - Personal website template',
        template: '%s | Nim',
    },
    description:
        'Nim is a free and open-source personal website template built with Next.js 15, React 19 and Motion-Primitives.',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider enableSystem={true} attribute="class" storageKey="theme" defaultTheme="system">
                    <ApolloProvider>
                        <HandledUserContext>
                            <LayoutStyle>{children}</LayoutStyle>
                        </HandledUserContext>
                    </ApolloProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
