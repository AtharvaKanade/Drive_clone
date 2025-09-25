import SignupForm from '../../components/SignupForm';
import { AuthProvider } from '../../lib/auth';

export default function SignupPage() {
  return (
    <AuthProvider>
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Create account</h1>
        <SignupForm />
      </main>
    </AuthProvider>
  );
}


