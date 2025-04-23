// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <div><p>Hi from Sign in</p><SignIn routing="path" path="/sign-in" /></div>;
}
