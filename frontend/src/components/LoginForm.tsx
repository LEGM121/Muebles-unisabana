import { useState } from 'react';
import { api } from '../services/api';

interface LoginSuccessPayload {
  customerId: string;
  fullName: string;
  email: string;
  token: string;
  role: string;
}

interface Props {
  onLoginSuccess?: (payload: LoginSuccessPayload) => void;
}

export function LoginForm({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('cliente@muebles.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.login({ email, password });
      setMessage(`Bienvenido ${response.user.fullName}`);
      onLoginSuccess?.({
        customerId: response.user.id ?? '',
        fullName: response.user.fullName,
        email: response.user.email,
        token: response.token,
        role: response.user.role ?? 'Customer'
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h3 className="mb-4 text-lg font-semibold">Autenticación</h3>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
          type="password"
          placeholder="********"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="w-full rounded-xl bg-brand-700 px-4 py-3 font-medium text-white disabled:bg-brand-300" type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-stone-500">Usuario demo sugerido: cliente@muebles.com / Password123!</p>
    </div>
  );
}
