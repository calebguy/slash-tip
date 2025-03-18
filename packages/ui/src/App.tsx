import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./layouts/App.layout";
import { Activity } from "./pages/Activity";
import { Balance } from "./pages/Balance";

export const routes = [
	{
		path: "/",
		title: "/activity",
		element: <Activity />,
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
