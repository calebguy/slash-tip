import { SidebarNav } from "../components/SidebarNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="grow flex">
			<SidebarNav />
			<div className="grow flex flex-col">{children}</div>
		</div>
	);
}
