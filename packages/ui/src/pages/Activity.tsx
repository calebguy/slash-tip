import { useQuery } from "@tanstack/react-query";
import { getActivity } from "../api";

export function Activity() {
	const { data } = useQuery({
		queryKey: ["activity"],
		queryFn: getActivity,
	});
	return (
		<div className="font-thin">
			{data?.map((item) => (
				<div className="break-all text-sm flex gap-2" key={item.id}>
					<div>{item.fromUser?.nickname}</div>
					<div>{item.toUser?.nickname}</div>
					<div>{item.amount}</div>
				</div>
			))}
		</div>
	);
}
