import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./components/Home";
import Leaderboard from "./components/Leaderboard";

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
