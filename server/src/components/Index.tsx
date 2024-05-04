import { Style, css } from "hono/css"

const layoutClass = css`
  padding: 1rem;
`

export function Index() {
	return (
		<html lang="en">
			<head>
				<Style />
			</head>
			<body className={layoutClass}>
				<div>✺/tip</div>
			</body>
		</html>
	)
}
