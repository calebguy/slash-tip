import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./layouts/App.layout";
import { Balance } from "./pages/Balance";
import { Home } from "./pages/Home";

export const routes = [
	{
		path: "/",
		title: "/activity",
		element: <Home />,
	},
	{
		path: "/balance",
		title: "/balance",
		element: <Balance />,
	},
];
export function App() {
	return (
		<BrowserRouter>
			<AppLayout>
				<Routes>
					{routes.map((route) => (
						<Route key={route.path} path={route.path} element={route.element} />
					))}
				</Routes>
			</AppLayout>
		</BrowserRouter>
	);
}
