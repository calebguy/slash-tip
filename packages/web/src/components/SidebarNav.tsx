"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";

function getRoutes(org: string) {
	return [
		{
			path: `/${org}`,
			title: "/activity",
		},
		{
			path: `/${org}/balance`,
			title: "/balance",
		},
	];
}

export function SidebarNav({ org }: { org: string }) {
	const pathname = usePathname();
	const routes = getRoutes(org);

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
