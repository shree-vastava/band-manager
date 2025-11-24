import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Band } from '../types/band';
import { bandService } from '../services/bandService';
import { useAuth } from './AuthContext';

interface BandContextType {
  bands: Band[];
  currentBand: Band | null;
  loading: boolean;
  setCurrentBand: (band: Band | null) => void;
  refreshBands: () => Promise<void>;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

export const BandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bands, setBands] = useState<Band[]>([]);
  const [currentBand, setCurrentBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchBands = async () => {
    if (!isAuthenticated) {
      setBands([]);
      setCurrentBand(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userBands = await bandService.getUserBands();
      setBands(userBands);
      
      // If there's a current band, refresh its data
      if (currentBand) {
        const updatedCurrentBand = userBands.find(b => b.id === currentBand.id);
        setCurrentBand(updatedCurrentBand || (userBands.length > 0 ? userBands[0] : null));
      } else if (userBands.length > 0) {
        // Set first band as current if none selected
        setCurrentBand(userBands[0]);
      }
    } catch (error) {
      console.error('Failed to fetch bands:', error);
      setBands([]);
      setCurrentBand(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshBands = async () => {
    await fetchBands();
  };

  useEffect(() => {
    fetchBands();
  }, [isAuthenticated]);

  const value: BandContextType = {
    bands,
    currentBand,
    loading,
    setCurrentBand,
    refreshBands,
  };

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>;
};

export const useBand = () => {
  const context = useContext(BandContext);
  if (context === undefined) {
    throw new Error('useBand must be used within a BandProvider');
  }
  return context;
};