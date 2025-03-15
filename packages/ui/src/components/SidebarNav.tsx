import classNames from "classnames";
import { Link, useLocation } from "react-router";
import { routes } from "../App";

export function SidebarNav() {
	const { pathname } = useLocation();
	return (
		<div className="flex flex-col items-start">
			{routes.map((route) => (
				<Link
					to={route.path}
					key={route.path}
					className={classNames("font-thin text-4xl hover:text-orange", {
						"text-orange": pathname === route.path,
						"text-paper": pathname !== route.path,
					})}
				>
					{route.title}
				</Link>
			))}
		</div>
	);
}
