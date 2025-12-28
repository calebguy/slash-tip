import Image from "next/image";

type FooterProps = {
	logoUrl?: string | null;
	orgName?: string;
};

export function Footer({ logoUrl, orgName }: FooterProps) {
	// Only show footer if org has a custom logo
	if (!logoUrl) {
		return null;
	}

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
