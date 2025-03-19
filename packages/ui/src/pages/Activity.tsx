import { useQuery } from "@tanstack/react-query";
import { getActivity } from "../api";

export function Activity() {
	const { data } = useQuery({
		queryKey: ["activity"],
		queryFn: getActivity,
	});
	return (
		<div
			id="orange-track"
			className="font-thin h-[calc(100dvh-250px)] overflow-y-auto"
		>
			<div>
				{data?.map((item) => (
					<div className="break-all text-sm flex gap-2" key={item.id}>
						<div>{item.fromUserId}</div>
						<div>{item.toUserId}</div>
						<div>{item.amount}</div>
					</div>
				))}
			</div>
		</div>
	);
}
