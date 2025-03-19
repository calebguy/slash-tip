import type { SvgProps } from "./idk";

export function Arrow({ title, ...props }: SvgProps) {
	return (
		<svg
			viewBox="0 0 11 14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>{title || "arrow"}</title>
			<path
				d="M6 1L6 12"
				stroke="currentColor"
				strokeWidth="0.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M6.11408 11.844L10.0014 7.6608L10.1806 7.82987L5.74692 12.6057L1.2954 7.83404L1.48959 7.6558L5.38154 11.844L5.74781 12.2381L6.11408 11.844Z"
				fill="currentColor"
				stroke="currentColor"
			/>
		</svg>
	);
}
