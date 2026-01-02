import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { SetupBanner } from "@/components/SetupBanner";
import { SidebarNav } from "@/components/SidebarNav";
import { getOrg } from "@/lib/api";

type Props = {
	children: React.ReactNode;
	params: Promise<{ org: string }>;
};

export default async function OrgLayout({ children, params }: Props) {
	const { org } = await params;
	const orgData = await getOrg(org);

	return (
		<div className="flex flex-col min-h-dvh">
			<div className="grow md:grid grid-cols-2 p-8">
				<div>
					<Suspense fallback={null}>
						<SetupBanner />
					</Suspense>
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
			<Footer logoUrl={orgData.logoUrl} orgName={orgData.name} />
		</div>
	);
}
