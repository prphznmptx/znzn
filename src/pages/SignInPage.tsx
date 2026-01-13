import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleSuccess = () => {
    if (redirect) {
      navigate(redirect);
    } else {
      navigate('/feed');
    }
  };

  return <AuthForm onSuccess={handleSuccess} />;
}
