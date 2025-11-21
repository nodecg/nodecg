import { useState, useEffect, useRef } from "react";
import { NodeCG as NCGTypes } from "../../../../types/nodecg";
import { AssetFile } from "./asset-file";
import {
	Button,
	Modal,
	useMantineTheme,
	Text,
	Group,
	Accordion,
} from "@mantine/core";
import { CircleX, CloudUpload, Download, Upload } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { Dropzone, type FileWithPath } from "@mantine/dropzone";
import classes from "./asset-category.module.css";

type AssetCategoryProps = {
	category: NCGTypes.Bundle.AssetCategory;
	collectionName: string;
};

export function AssetCategory({
	category,
	collectionName,
}: AssetCategoryProps) {
	const theme = useMantineTheme();
	const openRef = useRef<() => void>(null);
	const [opened, { open, close }] = useDisclosure(false);
	const [assets, setAssets] = useState<NCGTypes.AssetFile[]>([]);

	useEffect(() => {
		const assetsRep = NodeCG.Replicant<NCGTypes.AssetFile[]>(
			`assets:${category.name}`,
			collectionName,
		);

		const handleChange = (newVal?: NCGTypes.AssetFile[]) => {
			if (newVal) {
				const newAssets = newVal.map((asset) => ({ ...asset }));
				setAssets(newAssets);
			}
		};

		assetsRep.on("change", handleChange);

		// Cleanup subscription on unmount
		return () => {
			assetsRep.removeListener("change", handleChange);
		};
	}, []);

	async function handleDrop(files: FileWithPath[]) {
		if (!files || files.length === 0) return;

		const url = `/assets/${encodeURIComponent(collectionName)}/${encodeURIComponent(category.name)}`;

		const form = new FormData();
		files.forEach((f) => form.append("file", f, f.name));

		try {
			const resp = await fetch(url, {
				method: "POST",
				body: form,
				credentials: "include",
			});

			if (resp.ok) {
				const text = await resp.text();
				console.log("Upload success:", text);
				close();
			} else {
				const body = await resp.text();
				console.error("Upload failed:", resp.status, body);
			}
		} catch (err) {
			console.error("Network/upload error:", err);
		}
	}

	return (
		<Accordion.Item value={category.name}>
			<Accordion.Control classNames={{ label: classes["accordion-label"] }}>
				{category.name} ({assets.length})
			</Accordion.Control>
			<Accordion.Panel classNames={{ content: classes["panel-content"] }}>
				<div className={classes["accepted-types"]}>
					{category.allowedTypes?.map((type) => `*.${type}`).join(", ")}
				</div>
				<Button leftSection={<Upload />} onClick={open}>
					<div>Add Files</div>
				</Button>
				<div className={classes["asset-list"]}>
					{assets.map((asset) => (
						<AssetFile asset={asset} />
					))}
				</div>

				<Modal opened={opened} onClose={close} title="Upload Files" centered>
					<div className={classes["wrapper"]}>
						<Dropzone
							openRef={openRef}
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							onDrop={handleDrop}
							className={classes["dropzone"]}
							radius="md"
							accept={category.allowedTypes?.map((type) => `.${type}`)}
							maxSize={30 * 1024 ** 2} // 30 MB TODO: Make configurable
						>
							<div style={{ pointerEvents: "none" }}>
								<Group justify="center">
									<Dropzone.Accept>
										<Download size={50} color={theme.colors.blue[6]} />
									</Dropzone.Accept>
									<Dropzone.Reject>
										<CircleX size={50} color={theme.colors.red[6]} />
									</Dropzone.Reject>
									<Dropzone.Idle>
										<CloudUpload size={50} />
									</Dropzone.Idle>
								</Group>

								<Text ta="center" fw={700} fz="lg" mt="xl">
									<Dropzone.Accept>Drop files here</Dropzone.Accept>
									<Dropzone.Reject>Invalid File Type</Dropzone.Reject>
									<Dropzone.Idle>Upload files</Dropzone.Idle>
								</Text>
								<Text ta="center" fz="sm" mt="xs" c="dimmed">
									{category.allowedTypes?.map((type) => `*.${type}`).join(", ")}
								</Text>
							</div>
						</Dropzone>

						<Button
							className={classes["control"]}
							size="md"
							radius="xl"
							onClick={() => openRef.current?.()}
						>
							Select files
						</Button>
					</div>
				</Modal>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
