import { AuthModalProvider } from "@/components/auth";
import { Header, Footer } from "@/components/landing";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="w-full flex-1">{children}</main>
        <Footer />
      </div>
    </AuthModalProvider>
  );
}
