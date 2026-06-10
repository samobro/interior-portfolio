import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { ClerkAuthBridge } from "./components/ClerkAuthBridge.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <ClerkAuthBridge>
          <App />
        </ClerkAuthBridge>
      </ClerkProvider>
    </HashRouter>
  </React.StrictMode>
);
