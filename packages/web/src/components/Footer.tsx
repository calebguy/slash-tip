import Image from "next/image";
import { Logo } from "@/icons/logo";

type FooterProps = {
	logoUrl?: string | null;
	orgName?: string;
};

export function Footer({ logoUrl, orgName }: FooterProps) {
	// If org has a custom logo, show it
	if (logoUrl) {
		return (
			<div className="flex justify-center px-4 pb-8">
				<Image
					src={logoUrl}
					alt={orgName || "Organization logo"}
					width={40}
					height={40}
					className="w-10 h-10 object-contain"
				/>
			</div>
		);
	}

	// Default: show Syndicate logo without link
	return (
		<div className="flex justify-center px-4 pb-8">
			<Logo className="w-10 h-10 text-paper" />
		</div>
	);
}
