import { useNavigate } from 'react-router-dom';
export default function HomeButton() {
  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <button
      type="button"
      onClick={handleHomeClick}
      className="w-full mt-5 flex items-center justify-center gap-3 py-3 px-4 border border-paper-mist2 rounded-xl text-ink font-medium hover:bg-paper-mist transition-colors"
    >
      🏠 Back to Home
    </button>
  );
}
