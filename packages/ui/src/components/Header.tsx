import { Link } from "react-router";
import { Logo } from "../icons/logo";

export function Header() {
	return (
		<div className="flex justify-start mb-4">
			<Link to="/" className="inline-flex items-center">
				<Logo className="md:w-14 md:h-14 w-10 h-10 text-paper" />
				<div className="font-thin md:text-4xl text-3xl text-paper">/tip</div>
			</Link>
		</div>
	);
}
