import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </>
  );
}
