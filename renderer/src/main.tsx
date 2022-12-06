import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootEl = document.getElementById("root");

if (rootEl) {
  // 避免在开发时,useEffect执行两次
  const element =
    process.env.NODE_ENV !== "production" ? (
      <App></App>
    ) : (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  ReactDOM.createRoot(rootEl).render(element);
}
