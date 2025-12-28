import Link from "next/link";

export default function OrgNotFound() {
	return (
		<div className="flex flex-col min-h-dvh items-center justify-center p-8">
			<div className="text-center">
				<h1 className="text-6xl md:text-8xl font-thin text-paper mb-4">404</h1>
				<p className="text-xl md:text-2xl text-paper/60 font-thin mb-12">
					This organization doesn't exist yet.
				</p>
				<Link
					href="/"
					className="inline-block text-xl font-thin text-paper/60 hover:text-orange transition-colors"
				>
					← Back to home
				</Link>
			</div>
		</div>
	);
}
