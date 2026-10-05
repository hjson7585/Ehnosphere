import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

/**
 * Wraps a route that requires a signed-in user.
 *
 * Signed-out visitors used to be bounced straight to `/auth`, which left them
 * on a bare sign-in form with no idea which page they had asked for or why they
 * were moved. The block is now stated on the page they landed on, and sign-in
 * still returns them to it via `returnTo`. Pass `redirectImmediately` for a
 * route where the bounce really is the better experience.
 */
export function RequireAuth({
  children,
  title = "계속하려면 로그인하세요",
  description = "이 화면은 로그인한 관측자만 볼 수 있습니다.",
  redirectImmediately = false,
}: {
  children: ReactNode;
  /** Headline on the blocked screen. */
  title?: string;
  /** Says what the visitor gets by signing in. */
  description?: string;
  /** Skip the explanation and go straight to `/auth`. */
  redirectImmediately?: boolean;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-background">
        <SombreroGalaxy />
        <Loader2 className="relative z-10 size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    const signInHref = `/auth?returnTo=${encodeURIComponent(returnTo)}`;

    if (redirectImmediately) {
      return <Navigate to={signInHref} replace />;
    }

    return (
      <main className="relative flex min-h-screen items-center justify-center bg-background p-6">
        <SombreroGalaxy />
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(4,5,12,0.72),rgba(4,5,12,0.5))]" />
        <Card className="panel-space relative z-10 w-full max-w-md shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                <Lock className="size-5 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            로그인하면 이 화면으로 바로 되돌아옵니다.
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => navigate(signInHref)}>
              로그인
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              홈으로 돌아가기
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return children;
}
