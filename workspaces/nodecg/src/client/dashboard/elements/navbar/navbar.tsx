import { useState } from "react";
import { Code, Group } from "@mantine/core";
import classes from "./navbar.module.css";
import { Eye, Volume2, Upload, LogOut, type LucideProps, Settings } from "lucide-react";
import { LinksGroup } from "../components/NavbarLinksGroup";
import { Link } from "react-router-dom";
import type { NodeCG } from "../../../../types/nodecg";

type LucideIcon = React.ForwardRefExoticComponent<
	Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

type Link = {
	label: string;
	link: string;
	icon?: LucideIcon;
};

const nodecgPages: Link[] = [
	{ link: "graphics", label: "Graphics", icon: Eye },
	{ link: "assets", label: "Assets", icon: Upload },
	{ link: "sound", label: "Sound Mixer", icon: Volume2 },
	{ link: "settings", label: "Settings", icon: Settings },
];

type NavbarProps = {
	workspaces: NodeCG.Workspace[];
};

export function Navbar({ workspaces }: NavbarProps) {
	const [active, setActive] = useState("Main Dashboard");

	const reformedWorkspaces = workspaces.map((workspace) => {
		if (workspace.label.includes("/")) {
			const parts = workspace.label.split("/");
			const parent = parts[0];
			const child = parts.slice(1).join("/");
			return {
				label: parent,
				links: [
					{
						label: child,
						link: `dashboard/${workspace.route.replace(/^workspace\//, "")}`,
					},
				],
			};
		} else {
			return {
				label: workspace.label,
				link: `dashboard/${workspace.route.replace(/^workspace\//, "")}`,
			};
		}
	});

	const workspaceLinks = reformedWorkspaces.map((item) => {
		if ("links" in item) {
			return (
				<LinksGroup
					key={item.label}
					label={item.label ?? ""}
					links={item.links}
					onClick={(label) => {
						setActive(label);
					}}
					activeLabel={active}
				/>
			);
		}

		return (
			<NavbarLink
				key={item.label}
				link={item.link}
				label={item.label}
				active={item.label === active}
				onClick={() => {
					setActive(item.label);
				}}
			/>
		);
	});

	const nodecgLinks = nodecgPages.map((item) => (
		<NavbarLink
			key={item.label}
			link={item.link}
			label={item.label}
			active={item.label === active}
			onClick={() => {
				setActive(item.label);
			}}
			Icon={item.icon}
		/>
	));

	const isAuthEnabled = window.ncgConfig.login?.enabled ?? false;

	return (
		<nav className={classes["navbar"]}>
			<div className={classes["navbarMain"]}>
				<Group className={classes["header"]} justify="space-between">
					<img
						id="mainLogo"
						className={classes["logo"]}
						src="/dashboard/img/horiz-logo-2x.png"
						alt="NodeCG"
					/>
					<a
						href="https://nodecg.dev"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Code color="nodecg" fw={700}>
							v{window.__renderData__.version}
						</Code>
					</a>
				</Group>
				{workspaceLinks}
			</div>

			<div className={classes["footer"]}>
				{nodecgLinks}
				{isAuthEnabled && (
					<>
						<div className={classes["divider"]}></div>

						<a
							href="#"
							className={classes["link"]}
							onClick={(event) => {
								event.preventDefault();
							}}
						>
							<LogOut className={classes["linkIcon"]} />
							<span>Logout</span>
						</a>
					</>
				)}
			</div>
		</nav>
	);
}

type NavbarLinkProps = {
	label: string;
	active: boolean;
	onClick: () => void;
	Icon?: LucideIcon;
	link: string;
};

function NavbarLink({ label, active, onClick, Icon, link }: NavbarLinkProps) {
	return (
		<Link
			className={classes["link"]}
			data-active={active}
			to={link}
			onClick={() => {
				onClick();
			}}
		>
			{Icon && <Icon className={classes["linkIcon"]} />}
			<span>{label}</span>
		</Link>
	);
}
