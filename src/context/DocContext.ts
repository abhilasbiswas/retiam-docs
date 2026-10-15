import { createContext, useContext } from 'react';
import type { DocPage } from '../types';

interface DocContextType {
  currentPage: DocPage;
  setCurrentPageId: (id: string) => void;
}

export const DocContext = createContext<DocContextType>({
  currentPage: { id: '', group: '', title: '', sections: [] },
  setCurrentPageId: () => {},
});

export const useDoc = () => useContext(DocContext);
