/**
 * Main App Component
 * Entry point for CampusIQ application
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';
import './styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

/**
 * App Component
 * Wraps the application with providers and routes
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <ThemeProvider>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar
              closeOnClick
              pauseOnHover
              draggable
            />
          </ThemeProvider>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
