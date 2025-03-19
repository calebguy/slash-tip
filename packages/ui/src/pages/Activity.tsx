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
				<div className="break-all flex items-center" key={item.id}>
					<div className="text-slime">{item.amount}/</div>
					<div>{item.fromUser?.nickname}</div>
					<div className="text-orange">→</div>
					<div>{item.toUser?.nickname}</div>
				</div>
			))}
		</div>
	);
}
