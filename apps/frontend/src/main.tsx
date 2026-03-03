import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "@/app-router";
import { AuthProvider } from "@/lib/context/auth";
import "@/api";
import "./index.css";

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </StrictMode>,
  );
}
