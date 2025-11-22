import { useState } from "react";
import type { NodeCG } from "../../../../types/nodecg";
import { ActionIcon, Collapse, Group } from "@mantine/core";

import classes from "./panel.module.css";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { IframeResizer } from "@open-iframe-resizer/react";

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
				<PanelContent panel={props.panel} />
			) : (
				<Collapse in={collapsed}>
					<PanelContent panel={props.panel} />
				</Collapse>
			)}
		</div>
	);
}

interface PanelContentProps {
	panel: NodeCG.Bundle.Panel;
}

function PanelContent(props: PanelContentProps) {
	return (
		<div style={{ padding: 0, height: "100%" }}>
			<IframeResizer
				className={classes["iframe"]}
				style={{ height: "100%", width: "100%" }}
				src={`/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}`}
				id={`${props.panel.bundleName}_${props.panel.name}_iframe`}
				loading="lazy"
			/>
		</div>
	);
}
