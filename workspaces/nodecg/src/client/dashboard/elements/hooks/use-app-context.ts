import { useOutletContext } from "react-router";
import type { AppContext } from "../dashboard";

export function useAppContext() {
	return useOutletContext<AppContext>();
}
