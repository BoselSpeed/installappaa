import { Link } from 'react-router-dom';

const WelcomeSection = ({ title, description, ctaText, ctaUrl, secondaryText, secondaryUrl }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">{title}</h1>
      <p className="mb-6 text-gray-600">{description}</p>
      <div className="flex flex-col space-y-4">
        <Link
          to={ctaUrl}
          className="flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
        >
          {ctaText}
        </Link>
        {secondaryText && secondaryUrl && (
          <Link
            to={secondaryUrl}
            className="flex items-center justify-center px-6 py-3 text-sm font-medium text-black border border-black rounded hover:bg-gray-50 transition-colors"
          >
            {secondaryText}
          </Link>
        )}
      </div>
    </div>
  );
};

export { WelcomeSection };
