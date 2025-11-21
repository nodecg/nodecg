import { useEffect, useLayoutEffect, useRef } from "react";
import Packery from "packery";
import Draggabilly from "draggabilly";

interface PackeryGridProps extends React.PropsWithChildren {
	itemSelector?: string;
	columnWidth?: number;
	gutter?: number;
	isInitLayout?: boolean;
	containerStyle?: React.CSSProperties;
}

export function PackeryGrid(props: PackeryGridProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const packeryRef = useRef<typeof Packery | null>(null);

	useLayoutEffect(() => {
		if (!containerRef.current) {
			return;
		}

		packeryRef.current = new Packery(containerRef.current, {
			itemSelector: props.itemSelector,
			columnWidth: props.columnWidth,
			gutter: props.gutter,
			isInitLayout: props.isInitLayout,
			containerStyle: props.containerStyle,
		});

		// Create Draggabilly instances for each item and bind them
		if (props.itemSelector) {
			const items = containerRef.current.querySelectorAll(props.itemSelector);
			items.forEach((item) => {
				const draggie = new Draggabilly(item as HTMLElement, {
					handles: [".dragHandle"],
				});
				packeryRef.current?.bindDraggabillyEvents(draggie);
			});
		}

		packeryRef.current.layout();

		return () => {
			packeryRef.current?.destroy();
			packeryRef.current = null;
		};
	}, [
		props.itemSelector,
		props.columnWidth,
		props.gutter,
		props.isInitLayout,
		props.containerStyle,
	]);

	useLayoutEffect(() => {
		const handler = packeryRef.current.on("dragItemPositioned", () => {
			setTimeout(() => {
				packeryRef.current?.layout();
			}, 100);
		});

		return () => {
			packeryRef.current?.off("dragItemPositioned", handler);
		};
	}, [props.children]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			packeryRef.current?.layout();
		}, 250);

		return () => {
			clearTimeout(timeout);
		};
	}, []);

	// Cursed but the original did this as well
	useEffect(() => {
		let timeout: number | undefined;
		const handler = () => {
			window.clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				packeryRef.current?.layout();
			}, 500);
		};
		document.addEventListener("click", handler, true);
		return () => {
			document.removeEventListener("click", handler, true);
			window.clearTimeout(timeout);
		};
	}, []);

	return <div ref={containerRef}>{props.children}</div>;
}
