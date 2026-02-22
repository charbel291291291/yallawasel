import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import AppShell from "@/components/AppShell";

/**
 * Main Application Entry Point
 * Implements global providers and main routing.
 */
function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
