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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import Loader from "@/components/loader";
import { authClient } from "@/features/auth/lib/auth-client";

import { GoogleIcon } from "./google-icon";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const navigate = useNavigate({
    from: "/auth/register",
  });
  const feedback = useFeedback();
  const { isPending } = authClient.useSession();
  const [isGooglePending, setIsGooglePending] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (value) => {
    await authClient.signUp.email(
      {
        name: value.name,
        email: value.email,
        password: value.password,
      },
      {
        onSuccess: () => {
          navigate({ to: "/" });
          feedback.success("Sign up successful");
        },
        onError: (error) => {
          feedback.error(
            "Sign up failed",
            error.error.message || error.error.statusText,
          );
        },
      },
    );
  });

  const onGoogleSignUp = async () => {
    setIsGooglePending(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: window.location.origin,
      },
      {
        // On success the browser navigates away to Google, so the button is
        // intentionally left in its pending state.
        onError: (error) => {
          setIsGooglePending(false);
          feedback.error(
            "Google sign in failed",
            error.error.message || error.error.statusText,
          );
        },
      },
    );
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Create an account</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Enter your details below to create your account
          </p>
        </div>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-name">Name</FieldLabel>
              <Input
                {...field}
                id="signup-name"
                placeholder="Jane Doe"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                {...field}
                id="signup-email"
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
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="signup-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isGooglePending}
          >
            {form.formState.isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={onGoogleSignUp}
            disabled={isGooglePending || form.formState.isSubmitting}
          >
            {isGooglePending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isGooglePending ? "Redirecting..." : "Sign up with Google"}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Already have an account?{" "}
          <Link to="/auth/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
