"use client";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
export function ActionButtons() {
  const { data: session } = useSession();
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
      {session ? (
        <Link href="/dashboard">
          <Button
            size="lg"
            className="group px-8 py-3 text-lg bg-background text-foreground hover:bg-background/90"
            variant="outline"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      ) : (
        <>
          <Button
            size="lg"
            onClick={() => signIn("google")}
            className="group px-8 py-3 text-lg bg-background text-foreground hover:bg-background/90"
            variant="outline"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" />
            Sign in with Google
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </>
      )}
    </div>
  );
}
