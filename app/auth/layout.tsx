import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - ALX Poll',
  description: 'Login or register to create and participate in polls',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}