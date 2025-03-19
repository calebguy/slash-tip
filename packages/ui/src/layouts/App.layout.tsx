import { Footer } from "../components/Footer";
import { SidebarNav } from "../components/SidebarNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col grow">
			<div className="grow md:grid grid-cols-2 p-8">
				<div>
					<SidebarNav />
				</div>
				<div
					id="orange-track"
					className="text-3xl md:text-4xl grow flex flex-col justify-center items-start md:p-10 mt-10 md:mt-0"
				>
					<div className="h-[calc(100dvh-250px)] overflow-y-auto w-full">
						{children}
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}
