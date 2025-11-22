import { useState } from "react";
import type { NodeCG } from "../../../../types/nodecg";
import { ActionIcon, Collapse, Group, Paper } from "@mantine/core";

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
	const width = nodecgWidthToPixel(props.panel.width ?? 3);

	const iframeProps: React.IframeHTMLAttributes<HTMLIFrameElement> = {
		className: classes["iframe"],
		src: `/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}`,
		id: `${props.panel.bundleName}_${props.panel.name}_iframe`,
		loading: "lazy",
	};

	return (
		<Paper
			shadow="sm"
			withBorder
			style={{ width }}
			className={`${classes["panel"]} ncg-dashboard-panel ${isFullbleed ? classes["fullbleed"] : ""}`}
		>
			<div className={`${classes["header"]} dragHandle`}>
				<span>{props.panel.title}</span>
				<Group gap="xs">
					<ActionIcon
						component="a"
						href={`/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}?standalone=true`}
						variant="transparent"
						target="_blank"
						rel="noopener noreferrer"
					>
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
				<iframe {...iframeProps} />
			) : (
				<Collapse in={collapsed}>
					<IframeResizer {...iframeProps} />
				</Collapse>
			)}
		</Paper>
	);
}
