import { Footer } from "@/components/Footer";
import { SidebarNav } from "@/components/SidebarNav";

type Props = {
	children: React.ReactNode;
	params: Promise<{ org: string }>;
};

export default async function OrgLayout({ children, params }: Props) {
	const { org } = await params;

	return (
		<div className="flex flex-col min-h-dvh">
			<div className="grow md:grid grid-cols-2 p-8">
				<div>
					<SidebarNav org={org} />
				</div>
				<div
					id="orange-track"
					className="text-3xl md:text-4xl grow flex flex-col justify-center items-start md:p-10 mt-10 md:mt-0"
				>
					<div className="h-[calc(100dvh-250px)] overflow-y-auto w-full leading-10">
						{children}
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}
