import classNames from "classnames";
import { Link, useLocation } from "react-router";
import { routes } from "../App";

export function SidebarNav() {
	const { pathname } = useLocation();
	return (
		<div className="flex flex-col md:items-end items-start justify-center h-full">
			<div className="text-left">
				{routes.map((route) => (
					<Link
						to={route.path}
						key={route.path}
						className={classNames(
							"font-thin text-4xl hover:text-orange block",
							{
								"text-orange": pathname === route.path,
								"text-paper": pathname !== route.path,
							},
						)}
					>
						{route.title}
					</Link>
				))}
			</div>
		</div>
	);
}
