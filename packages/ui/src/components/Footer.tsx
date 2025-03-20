import { Link } from "react-router";
import { Logo } from "../icons/logo";

export function Footer() {
	return (
		<div className="flex justify-center px-4 pb-8">
			<Link
				to="https://syndicate.io"
				className="hover:text-orange text-paper transition-colors duration-150"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Logo className="w-10 h-10" />
			</Link>
		</div>
	);
}
