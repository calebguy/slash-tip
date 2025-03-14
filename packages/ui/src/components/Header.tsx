import { Link } from "react-router";
import { Logo } from "../icons/logo";

export function Header() {
	return (
		<div className="flex justify-start">
			<Link to="/" className="inline-flex items-center">
				<Logo className="md:w-14 md:h-14 w-10 h-10 text-slime" />
				<div className="font-thin text-3xl md:text-5xl text-slime">/tip</div>
			</Link>
		</div>
	);
}
