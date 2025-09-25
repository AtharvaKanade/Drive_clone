import LoginForm from '../../components/LoginForm';
import { AuthProvider } from '../../lib/auth';

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <LoginForm />
      </main>
    </AuthProvider>
  );
}


