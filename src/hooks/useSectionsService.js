import { useState, useEffect } from 'react';
import { sectionsService } from '../firebase/service';

export const useSectionsService = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = sectionsService.onSectionsChange(
      (sections) => {
        setSections(sections);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { sections, loading, error };
};
