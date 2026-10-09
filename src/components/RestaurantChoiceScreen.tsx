import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const RestaurantChoiceScreen: React.FC = () => {
  const { setSelectedRestaurant, setCurrentScreen } = useApp();

  useEffect(() => {
    setSelectedRestaurant('golodnyy_turist');
    setCurrentScreen('order');
  }, [setSelectedRestaurant, setCurrentScreen]);

  return null;
};
