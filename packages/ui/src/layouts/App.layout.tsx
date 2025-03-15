import { Footer } from "../components/Footer";
import { SidebarNav } from "../components/SidebarNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col grow">
			<div className="grow md:grid grid-cols-5 p-8">
				<div className="col-span-2">
					<SidebarNav />
				</div>
				<div className="col-span-3 text-3xl md:text-4xl grow flex flex-col justify-center items-start md:p-10 mt-10 md:mt-0">
					{children}
				</div>
			</div>
			<Footer />
		</div>
	);
}
