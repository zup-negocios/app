import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// Reload automatically when a new service worker takes over
registerSW({
  onNeedRefresh() { window.location.reload(); },
  onOfflineReady() {},
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
