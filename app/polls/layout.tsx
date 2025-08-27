import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polls - ALX Poll',
  description: 'View and participate in polls',
};

export default function PollsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}