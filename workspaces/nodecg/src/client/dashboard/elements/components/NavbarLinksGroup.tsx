import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
	Box,
	Collapse,
	Group,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import classes from "./NavbarLinksGroup.module.css";
import { Link } from "react-router-dom";

interface LinksGroupProps {
	icon?: React.FC<any>;
	label: string;
	initiallyOpened?: boolean;
	links?: { label: string; link: string }[];
	activeLabel: string;
	onClick?: (label: string) => void;
}

export function LinksGroup({
	icon: Icon,
	label,
	initiallyOpened,
	links,
	activeLabel,
	onClick,
}: LinksGroupProps) {
	const hasLinks = Array.isArray(links);
	const [opened, setOpened] = useState(initiallyOpened ?? false);
	const items = (hasLinks ? links : []).map((link) => (
		<Link
			className={classes["link"]}
			data-active={link.label === activeLabel}
			to={link.link}
			key={link.label}
			onClick={() => {
				onClick?.(link.label);
			}}
		>
			{link.label}
		</Link>
	));

	return (
		<>
			<UnstyledButton
				onClick={() => {
					setOpened((o) => !o);
				}}
				className={classes["control"]}
			>
				<Group justify="space-between" gap={0}>
					<Box style={{ display: "flex", alignItems: "center" }}>
						{Icon && (
							<ThemeIcon variant="light" size={30}>
								<Icon size={18} />
							</ThemeIcon>
						)}
						<Box style={{ marginLeft: Icon ? "var(--mantine-spacing-md)" : 0 }}>
							{label}
						</Box>
					</Box>
					{hasLinks && (
						<ChevronRight
							className={classes["chevron"]}
							size={16}
							style={{ transform: opened ? "rotate(-90deg)" : "none" }}
						/>
					)}
				</Group>
			</UnstyledButton>
			{hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
		</>
	);
}
