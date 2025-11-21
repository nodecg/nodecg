import {
	useLayoutEffect,
	useRef,
	useState,
	type ReactEventHandler,
} from "react";
import type { NodeCG } from "../../../../types/nodecg";
import { ActionIcon, Collapse, Group } from "@mantine/core";

import classes from "./panel.module.css";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { initialize } from "@open-iframe-resizer/core";

// 1 => 128
// 2 => 272
// 3 => 416
// 4 => 560
// 5 => 704
// 6 => 848
// 7 => 992
// 8 => 1136
// 9 => 1280
// 10 => 1424
export function nodecgWidthToPixel(width: number) {
	return 128 + (width - 1) * 144;
}

interface PanelProps {
	panel: NodeCG.Bundle.Panel;
}

export function Panel(props: PanelProps) {
	const [collapsed, setCollapsed] = useState(true);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const isFullbleed = props.panel.fullbleed ?? false;
	const width = isFullbleed
		? "100%"
		: `${nodecgWidthToPixel(props.panel.width ?? 3)}px`;
	const height = isFullbleed ? "100%" : "";

	const panelTitle = props.panel.title || props.panel.name;

	function openInNewTab() {
		const url = `/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}?standalone=true`;
		window.open(url, "_blank", "noopener,noreferrer");
	}

	function attachIframeResizer(iframe: HTMLIFrameElement) {
		initialize(
			{
				onIframeResize: (context) => {
					// this.$.collapse.updateSize("auto", false);
					context.iframe.dispatchEvent(new CustomEvent("iframe-resized"));
				},
			},
			iframe,
		);
	}

	useLayoutEffect(() => {
		if (isFullbleed || !iframeRef.current) return;

		if (iframeRef.current.contentWindow?.document.readyState === "complete") {
			attachIframeResizer(iframeRef.current);
		} else {
			iframeRef.current.addEventListener("load", () => {
				if (!iframeRef.current) return;
				attachIframeResizer(iframeRef.current);
			});
		}
	}, [isFullbleed, iframeRef.current]);

	function iframeLoadHandler(event: React.SyntheticEvent<HTMLIFrameElement>) {
		if (isFullbleed) {
			return;
		}

		const iframe = event.currentTarget;
		if (iframe.contentWindow) {
			const padding =
				parseFloat(
					window.getComputedStyle(iframe.contentWindow.document.body).marginTop,
				) +
				parseFloat(
					window.getComputedStyle(iframe.contentWindow.document.body)
						.marginBottom,
				);
			iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight + padding}px`;
		}
	}

	return (
		<div style={{ width, height }} className="ncg-dashboard-panel">
			<div className={`${classes["header"]} dragHandle`}>
				<span>{panelTitle}</span>
				<Group gap="xs">
					<ActionIcon variant="transparent" onClick={openInNewTab}>
						<ExternalLink />
					</ActionIcon>
					{!isFullbleed && (
						<ActionIcon
							variant="transparent"
							onClick={() => setCollapsed((c) => !c)}
						>
							{collapsed ? <ChevronDown /> : <ChevronUp />}
						</ActionIcon>
					)}
				</Group>
			</div>
			{isFullbleed ? (
				<PanelContent
					panel={props.panel}
					ref={iframeRef}
					onLoad={iframeLoadHandler}
				/>
			) : (
				<Collapse in={collapsed}>
					<PanelContent
						panel={props.panel}
						ref={iframeRef}
						onLoad={iframeLoadHandler}
					/>
				</Collapse>
			)}
		</div>
	);
}

interface PanelContentProps {
	panel: NodeCG.Bundle.Panel;
	onLoad?: ReactEventHandler<HTMLIFrameElement>;
	ref: React.Ref<HTMLIFrameElement>;
}

function PanelContent(props: PanelContentProps) {
	return (
		<div style={{ padding: 0, height: "100%" }}>
			<iframe
				className={classes["iframe"]}
				style={{ height: "100%", width: "100%" }}
				src={`/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}`}
				id={`${props.panel.bundleName}_${props.panel.name}_iframe`}
				loading="lazy"
				onLoad={props.onLoad}
				ref={props.ref}
			/>
		</div>
	);
}
