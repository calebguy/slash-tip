import { Style, css } from "hono/css"
import { getLeaderBoard } from "../slash-tip"

const layoutClass = css`
  padding: 1rem;
	background: #00FF00;
	text-align: center;
	font-family: "Jacquard 12", system-ui;
  font-weight: 400;
  font-style: normal;
`

const titleClass = css`
	font-size: 48px;
`

const userContentClass = css`
	font-size: 64px;
	margin-top: 2rem;
`

const userTitleClass = css`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1.5rem;
`

export async function Index() {
	const leaderBoard = await getLeaderBoard()
	return (
		<html lang="en">
			<head>
				<Style />
				<link rel="preconnect" href="https://fonts.googleapis.com"/>
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={true}/>
				<link href="https://fonts.googleapis.com/css2?family=Jacquard+12&display=swap" rel="stylesheet" />
			</head>
			<body className={layoutClass}>
				<div className={titleClass}>*/tip</div>
				<div className={userContentClass}>
					{leaderBoard.map((user) => (
						<div className={userTitleClass}>
							<div>{user.balance.toString()}<span>*</span></div>/
							<div>{user.nickname}</div>
						</div>
					))}
				</div>
			</body>
		</html>
	)
}
