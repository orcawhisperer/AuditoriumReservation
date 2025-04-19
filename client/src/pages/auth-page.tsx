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
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/footer";

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/20 to-[#4B5320]/5 flex flex-col pb-32">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">
                  {t('translation.common.appName')}
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                {t('translation.common.welcome')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
              <div className="space-y-2">
                <div className="font-semibold">{t('translation.auth.secureAccess')}</div>
                <p className="text-sm text-muted-foreground">
                  {t('translation.auth.secureAccessDescription')}
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">{t('translation.auth.realTimeUpdate')}</div>
                <p className="text-sm text-muted-foreground">
                  {t('translation.auth.realTimeUpdateDescription')}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                variant="link"
                onClick={() => setLocation("/about")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('translation.common.about')} {t('translation.common.appName')}
              </Button>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>{t('translation.auth.loginTitle')}</CardTitle>
              </div>
              <CardDescription>
                {t('translation.auth.registerCta')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer variant="simple" />
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const { t } = useTranslation();
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
              <FormLabel>{t('translation.auth.username')}</FormLabel>
              <FormControl>
                <Input placeholder={t('translation.auth.username')} {...field} />
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
              <FormLabel>{t('translation.auth.password')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('translation.auth.password')}
                  {...field}
                />
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
          {loginMutation.isPending ? t('translation.common.loading') : t('translation.auth.loginButton')}
        </Button>
      </form>
    </Form>
  );
}
