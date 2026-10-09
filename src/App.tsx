/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/SplashScreen';
import { RestaurantChoiceScreen } from './components/RestaurantChoiceScreen';
import { OrderCreationScreen } from './components/OrderCreationScreen';
import { OrderHistoryScreen } from './components/OrderHistoryScreen';
import { PaperOrderView } from './components/PaperOrderView';
import { OrderFulfillmentScreen } from './components/OrderFulfillmentScreen';
import { RecipesScreen } from './components/recipes/RecipesScreen';
import { DeliverySettingsScreen } from './components/DeliverySettingsScreen';
import { BottomNavigationBar } from './components/BottomNavigationBar';
import { DatabaseConnectModal } from './components/DatabaseConnectModal';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { currentScreen, isDatabaseConnectModalOpen, closeDatabaseConnectModal } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-stone-900 font-sans flex flex-col">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col relative min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16 }}
            className="w-full flex-1 flex flex-col"
          >
            {currentScreen === 'splash' && <SplashScreen />}
            {currentScreen === 'choice' && <RestaurantChoiceScreen />}
            {currentScreen === 'order' && <OrderCreationScreen />}
            {currentScreen === 'fulfill' && <OrderFulfillmentScreen />}
            {currentScreen === 'history' && <OrderHistoryScreen />}
            {currentScreen === 'paper_view' && <PaperOrderView />}
            {currentScreen === 'recipes' && <RecipesScreen />}
            {currentScreen === 'delivery_settings' && <DeliverySettingsScreen />}
          </motion.div>
        </AnimatePresence>

        {/* Persistent bottom navigation bar across all main screens */}
        {currentScreen !== 'splash' && <BottomNavigationBar />}

        {/* Global Database Connection Modal */}
        <DatabaseConnectModal
          isOpen={isDatabaseConnectModalOpen}
          onClose={closeDatabaseConnectModal}
          onSuccess={closeDatabaseConnectModal}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
