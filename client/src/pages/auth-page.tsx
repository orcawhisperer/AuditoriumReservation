import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";
import { z } from "zod";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/20 to-[#4B5320]/5 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Shahbaaz Auditorium
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Your secure portal for auditorium seat reservations.
              Book up to 4 seats with real-time availability tracking.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
            <div className="space-y-2">
              <div className="font-semibold">Secure Access</div>
              <p className="text-sm text-muted-foreground">
                Military-grade authentication system
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Real-time Updates</div>
              <p className="text-sm text-muted-foreground">
                Instant seat availability status
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Secure Access</CardTitle>
            </div>
            <CardDescription>
              Please contact an administrator to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          Login
        </Button>
      </form>
    </Form>
  );
}