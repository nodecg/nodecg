import { useMemo, useState } from "react";
import { CopyButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	Card,
	Text,
	Group,
	Button,
	Modal,
	Code,
	Stack,
	Tooltip,
	Alert,
} from "@mantine/core";
import { AlertTriangle, CopyIcon, Key, RefreshCw } from "lucide-react";

import classes from "./settings.module.css";

export function AuthKey() {
	const token = window.token ?? "";
	const canUseKey = useMemo(
		() => Boolean(window.ncgConfig?.login?.enabled && token),
		[token],
	);

	const [showKeyOpen, setShowKeyOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	const handleResetKey = () => {
		setResetOpen(false);
		window.socket.emit("regenerateToken", (err?: unknown) => {
			if (err) {
				console.error(err);
				return;
			}
			document.location.reload();
		});
	};

	return (
		<>
			<Card
				withBorder
				shadow="sm"
				padding="lg"
				radius="md"
				className={classes["card"]}
			>
				<Stack gap="md">
					<Text fz="lg" fw={500}>
						Auth Key
					</Text>
					<Text>
						Resetting your key will disrupt all current sessions using it. When
						you reset your key, the dashboard will be refreshed so that a new
						key can be obtained.
					</Text>

					<Group justify="flex-end" wrap="wrap">
						<CopyButton value={token} timeout={1500}>
							{({ copied, copy }) => (
								<Tooltip
									withArrow
									label={copied ? "Copied" : "Copy Key"}
									disabled={!canUseKey}
								>
									<Button
										variant="default"
										onClick={() => {
											if (!canUseKey) return;
											copy();
											notifications.show({
												message: "Key copied to clipboard.",
											});
										}}
										leftSection={<CopyIcon size={16} />}
										disabled={!canUseKey}
									>
										Copy Key
									</Button>
								</Tooltip>
							)}
						</CopyButton>

						<Button
							color="blue"
							onClick={() => setShowKeyOpen(true)}
							leftSection={<Key size={16} />}
							disabled={!canUseKey}
						>
							Show Key
						</Button>

						<Button
							color="red"
							variant="filled"
							onClick={() => setResetOpen(true)}
							leftSection={<RefreshCw size={16} />}
						>
							Reset Key
						</Button>
					</Group>
				</Stack>
			</Card>

			<Modal
				opened={showKeyOpen}
				onClose={() => setShowKeyOpen(false)}
				title="NodeCG Key"
				centered
			>
				<Stack gap="sm">
					<Code fz="sm" p="sm" block>
						{token || "No key available"}
					</Code>
					<Alert
						color="yellow"
						variant="light"
						icon={<AlertTriangle size={16} />}
					>
						Do not give this key to anyone or show it on stream! If you
						accidentally reveal it, reset it immediately!
					</Alert>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setShowKeyOpen(false)}>
							Close
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Modal
				opened={resetOpen}
				onClose={() => setResetOpen(false)}
				title="Reset NodeCG Key"
				centered
			>
				<Stack gap="md">
					<Alert
						color="yellow"
						variant="light"
						icon={<AlertTriangle size={16} />}
					>
						Are you sure you wish to reset your NodeCG key? Doing so will
						invalidate all URLs currently loaded into your streaming software!
					</Alert>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setResetOpen(false)}>
							No, Cancel
						</Button>
						<Button color="red" onClick={handleResetKey}>
							Yes, reset
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
