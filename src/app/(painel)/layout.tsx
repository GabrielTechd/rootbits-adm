import { PainelLayout } from '@/components/PainelLayout';

export default function PainelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PainelLayout>{children}</PainelLayout>;
}
