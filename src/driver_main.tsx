import React from "react";
import ReactDOM from "react-dom/client";
import DriverRouter from "./driver/DriverRouter";
import "../index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <DriverRouter />
        </React.StrictMode>
    );
}
