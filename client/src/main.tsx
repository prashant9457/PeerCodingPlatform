import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import "@neondatabase/auth-ui/css";
import { authClient } from "./auth/authClient.js";
import App from "./App.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NeonAuthUIProvider authClient={authClient}>
      <App />
    </NeonAuthUIProvider>
  </StrictMode>,
);
