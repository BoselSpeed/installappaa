import { useSectionsService } from '../../hooks/useSectionsService';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const { sections, loading, error } = useSectionsService();

  if (loading) return <div className="p-4">Loading sections...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading sections</div>;

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">الأقسام</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.id}
              to={`/sections/${section.id}`}
              className="flex items-center px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {section.title_ar || section.title_en || 'Unnamed Section'}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export { Sidebar };
