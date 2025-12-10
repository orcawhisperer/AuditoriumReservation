import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element. Make sure there is a <div id='root'></div> in index.html");
}
createRoot(rootElement).render(<App />);
