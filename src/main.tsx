import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocaleProvider } from "@/context/LocaleContext";
import { PreviewDeviceProvider } from "@/context/PreviewDeviceContext";

createRoot(document.getElementById("root")!).render(
  <LocaleProvider>
    <PreviewDeviceProvider>
      <App />
    </PreviewDeviceProvider>
  </LocaleProvider>,
);
