import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import "./index.css";
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WorkflowProvider>
            <App />
            <Toaster />
          </WorkflowProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
