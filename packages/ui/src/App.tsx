import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./Home";
import Leaderboard from "./Leaderboard";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/leaderboard" element={<Leaderboard />} />
			</Routes>
		</BrowserRouter>
	);
}
