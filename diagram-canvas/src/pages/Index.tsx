import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/** Redirect root to the editor */
const Index = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/editor', { replace: true }); }, [navigate]);
  return null;
};

export default Index;
