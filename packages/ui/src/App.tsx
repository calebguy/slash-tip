import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./layouts/App.layout";
import { Home } from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";

export const routes = [
	{
		path: "/",
		title: "/activity",
		element: <Home />,
	},
	{
		path: "/leaderboard",
		title: "/leaderboard",
		element: <Leaderboard />,
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
