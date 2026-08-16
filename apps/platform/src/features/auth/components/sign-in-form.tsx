import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@propertyos/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { PasswordInput } from "@propertyos/ui/components/password-input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import Loader from "@/components/loader";
import { authClient } from "@/features/auth/lib/auth-client";

import { GoogleIcon } from "./google-icon";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const navigate = useNavigate({
    from: "/auth/login",
  });
  const feedback = useFeedback();
  const { isPending } = authClient.useSession();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (value) => {
    await authClient.signIn.email(
      {
        email: value.email,
        password: value.password,
      },
      {
        onSuccess: () => {
          navigate({ to: "/" });
          feedback.success("Sign in successful");
        },
        onError: (error) => {
          feedback.error(
            "Sign in failed",
            error.error.message || error.error.statusText,
          );
        },
      },
    );
  });

  const onGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    });
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Welcome back</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Enter your email below to login to your account
          </p>
        </div>

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signin-email">Email</FieldLabel>
              <Input
                {...field}
                id="signin-email"
                type="email"
                placeholder="m@example.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signin-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="signin-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button variant="outline" type="button" onClick={onGoogleSignIn}>
            <GoogleIcon />
            Login with Google
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="underline underline-offset-4">
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
