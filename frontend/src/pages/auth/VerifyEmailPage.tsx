import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const { isLoading, isSuccess, isError } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authService.verifyEmail(token),
    enabled: !!token,
    retry: false,
  });

  if (!token) return (
    <div className="card p-8 text-center">
      <XCircle size={48} className="text-red-400 mx-auto mb-4" />
      <h2 className="font-serif text-xl font-bold text-earth-700 mb-3">Invalid Link</h2>
      <p className="text-earth-600 text-sm">No verification token found in the URL.</p>
    </div>
  );

  if (isLoading) return (
    <div className="card p-8 text-center">
      <p className="text-earth-600">Verifying your email...</p>
    </div>
  );

  if (isSuccess) return (
    <div className="card p-8 text-center">
      <CheckCircle size={48} className="text-forest-500 mx-auto mb-4" />
      <h2 className="font-serif text-xl font-bold text-earth-700 mb-3">Email Verified!</h2>
      <p className="text-earth-600 text-sm mb-4">Your account is now active.</p>
      <Link to="/login" className="btn-primary inline-block">Sign in</Link>
    </div>
  );

  return (
    <div className="card p-8 text-center">
      <XCircle size={48} className="text-red-400 mx-auto mb-4" />
      <h2 className="font-serif text-xl font-bold text-earth-700 mb-3">Verification Failed</h2>
      <p className="text-earth-600 text-sm mb-4">This link may have expired. Please request a new one.</p>
      <Link to="/login" className="text-forest-600 text-sm hover:underline">Back to sign in</Link>
    </div>
  );
}
