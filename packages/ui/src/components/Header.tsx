import { Link } from "react-router";
import { Logo } from "../icons/logo";

export function Header() {
	return (
		<div className="flex justify-start mb-4">
			<Link to="/" className="inline-flex items-center">
				<Logo className="md:w-16 md:h-16 w-10 h-10 text-paper" />
				<div className="font-thin text-3xl md:text-5xl text-paper">/tip</div>
			</Link>
		</div>
	);
}
