"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
	{
		path: "/",
		title: "/activity",
	},
	{
		path: "/balance",
		title: "/balance",
	},
];

export function SidebarNav() {
	const pathname = usePathname();
	return (
		<div className="flex flex-col md:items-end items-start justify-center h-full">
			<div className="text-left">
				{routes.map((route) => (
					<Link
						href={route.path}
						key={route.path}
						className={classNames(
							"font-thin text-4xl hover:text-orange block transition-colors duration-150",
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
