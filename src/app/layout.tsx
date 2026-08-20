import './globals.css';
import { AppProvider } from '@/lib/store';
import NotificationToast from '@/components/common/NotificationToast';

export const metadata = {
  title: 'Australian Employee Management System & Portals',
  description: 'Enterprise HR, Payroll, Leave Management, and Australian Compliance System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <AppProvider>
          {children}
          <NotificationToast />
        </AppProvider>
      </body>
    </html>
  );
}
