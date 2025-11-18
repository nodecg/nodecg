import { useEffect, useState } from "react";
import { Modal } from "@mantine/core";

import classes from "./dialog.module.css";
import { nodecgWidthToPixel } from "./panel";

import type { NodeCG } from "src/types/nodecg";

interface NodeCGDialogProps {
	panel: NodeCG.Bundle.Panel;
}

export function NodeCGDialog(props: NodeCGDialogProps) {
	const [opened, setOpened] = useState(false);

	function onClose() {
		setOpened(false);
	}

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (
				event.data &&
				event.data.type === "open-dialog" &&
				event.data.dialogId === `${props.panel.bundleName}_${props.panel.name}`
			) {
				setOpened(true);
			}
		}

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [props.panel.bundleName, props.panel.name]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			id={`${props.panel.bundleName}_${props.panel.name}`}
			size="auto"
			centered
			title={props.panel.title}
		>
			<iframe
				className={classes["iframe"]}
				style={{
					height: "100%",
					width: nodecgWidthToPixel(props.panel.width ?? 3),
				}}
				src={`/bundles/${props.panel.bundleName}/dashboard/${props.panel.file}`}
				id={`${props.panel.bundleName}_${props.panel.name}_iframe`}
				loading="lazy"
				onLoad={(event) => {
					const iframe = event.currentTarget;
					if (iframe.contentWindow) {
						const padding =
							parseFloat(
								window.getComputedStyle(iframe.contentWindow.document.body)
									.marginTop,
							) +
							parseFloat(
								window.getComputedStyle(iframe.contentWindow.document.body)
									.marginBottom,
							);
						iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight + padding}px`;
					}
				}}
			/>
		</Modal>
	);
}
