import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import * as emoji from "node-emoji";
import { getActivity } from "../api";
import { Arrow } from "../icons/arrow";
import { IDK } from "../icons/idk";

export function Activity() {
	const { data } = useQuery({
		queryKey: ["activity"],
		queryFn: getActivity,
	});
	return (
		<div className="font-thin flex flex-col gap-1 select-none">
			{data?.map((item) => (
				<div key={item.id} className="flex flex-col gap-0.5">
					<div className="flex items-center">
						<div className="text-paper italic">{item.fromUser?.nickname}</div>
						<Arrow className="w-5 h-5 md:w-6 md:h-6 text-slime -rotate-90 ml-2" />
						<Arrow className="w-5 h-5 md:w-6 md:h-6 text-slime -rotate-90 mx-1 -ml-1" />
						<div className="text-paper">{item.toUser?.nickname}</div>
					</div>
					{item.message && (
						<div className="text-paper/35 text-lg leading-4 italic">
							{emoji.emojify(item.message)}
						</div>
					)}
					<div
						className={classNames("flex items-end grow flex-wrap gap-1", {
							"mt-1": item.message,
						})}
					>
						{Array.from({ length: Number(item.amount) }).map((_, index) => (
							<IDK
								// biome-ignore lint/suspicious/noArrayIndexKey: so what
								key={`arrow-${index}`}
								className="w-5 h-5 md:w-6 md:h-6 text-orange -rotate-90"
							/>
						))}
						<div className="text-orange/60 text-lg leading-4">
							({item.amount})
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
