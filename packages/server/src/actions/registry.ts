import type { TipAction } from "./types";

const actions = new Map<string, TipAction>();

export function registerAction(action: TipAction): void {
	if (actions.has(action.type)) {
		console.warn(`Action type "${action.type}" is already registered, overwriting`);
	}
	actions.set(action.type, action);
	console.log(`Registered action: ${action.type}`);
}

export function getAction(type: string): TipAction {
	const action = actions.get(type);
	if (!action) {
		throw new Error(`Unknown action type: ${type}. Available: ${Array.from(actions.keys()).join(", ")}`);
	}
	return action;
}

export function hasAction(type: string): boolean {
	return actions.has(type);
}

export function getAvailableActions(): string[] {
	return Array.from(actions.keys());
}
