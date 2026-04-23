// Root layout — serves as skeleton for the global not-found and error boundaries.
// Locale-specific styling is applied in app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
