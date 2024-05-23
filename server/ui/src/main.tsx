import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";

const queryClient = new QueryClient();

// biome-ignore lint/style/noNonNullAssertion: its not null i promise
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);
