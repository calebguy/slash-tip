import { useQuery } from "@tanstack/react-query";
import { getActivity } from "../api";
import { Arrow } from "../icons/arrow";
import { IDK } from "../icons/idk";

export function Activity() {
	const { data } = useQuery({
		queryKey: ["activity"],
		queryFn: getActivity,
	});
	return (
		<div className="font-thin flex flex-col gap-2 select-none">
			{data?.map((item) => (
				<div key={item.id}>
					<div className="flex items-center">
						<div className="text-paper italic">{item.fromUser?.nickname}</div>
						<Arrow className="w-5 h-5 md:w-6 md:h-6 text-slime -rotate-90 ml-2" />
						<Arrow className="w-5 h-5 md:w-6 md:h-6 text-slime -rotate-90 mx-1 -ml-1" />
						<div className="text-paper">{item.toUser?.nickname}</div>
					</div>
					<div className="flex items-end grow flex-wrap gap-1">
						{Array.from({ length: Number(item.amount) }).map((_, index) => (
							<IDK
								key={`arrow-${index}`}
								className="w-5 h-5 md:w-6 md:h-6 text-orange -rotate-90"
							/>
						))}
						<div className="text-orange/40 text-lg leading-4">
							({item.amount})
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
