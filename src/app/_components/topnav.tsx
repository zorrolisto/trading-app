import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function TopNav() {
  return (
    <nav className="flex items-center justify-between border-b bg-[#6e00ff] p-6 text-xl font-semibold text-white">
      <div>Mi Web de Trading</div>

      <div className="flex flex-row">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full bg-white px-4 py-2 text-sm capitalize text-[#6e00ff]">
              Entrar
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
