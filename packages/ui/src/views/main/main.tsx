import { ReactNode } from 'react';

interface LayoutProps {
  title: string;
  children: ReactNode;
}

export const Main = ({ title, children }: LayoutProps) => {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <script defer src="/public/htmx.min.js" crossOrigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link rel="stylesheet" href="/public/output.css" />
      </head>
      <body>
        <div className="p-4">
          {children}
        </div>
      </body>
    </html>
  );
};