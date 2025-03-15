import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./layouts/App.layout";
import { Home } from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";

export const routes = [
	{
		path: "/",
		element: <Home />,
		title: "/tip",
	},
	{
		path: "/leaderboard",
		element: <Leaderboard />,
		title: "/leaderboard",
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
