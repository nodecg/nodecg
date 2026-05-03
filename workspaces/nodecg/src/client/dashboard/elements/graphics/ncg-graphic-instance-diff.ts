import { LitElement, html, css } from "lit";
import { nodecgTheme } from "../../css/nodecg-theme";
import { icon } from "../../icons";
import type { NodeCG } from "../../../../types/nodecg";
import type { ClientReplicant } from "../../../api/replicant";

let bundlesRep: ClientReplicant<NodeCG.Bundle[]>;

class NcgGraphicInstanceDiff extends LitElement {
	static override properties = {
		instance: { type: Object },
		_bundleVersion: { state: true },
		_bundleGit: { state: true },
	};

	instance: NodeCG.GraphicsInstance | null = null;
	private _bundleVersion = "";
	private _bundleGit: NodeCG.Bundle["git"] | null = null;

	static override styles = [
		nodecgTheme,
		css`
			:host {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				background: #212121;
				font-family: "Courier New", Courier, "Lucida Sans Typewriter",
					"Lucida Typewriter", monospace;
				font-size: 12px;
				max-width: 100%;
				padding: 0.5em 1em 0.5em 0;
				position: absolute;
				white-space: normal;
			}

			#body {
				flex: 1;
				min-width: 0;
			}

			button {
				background: none;
				border: none;
				color: inherit;
				cursor: pointer;
				padding: 4px;
			}

			.orange {
				color: #f4c008;
				font-weight: bold;
			}

			.green {
				color: #00a651;
				font-weight: bold;
			}
		`,
	];

	override firstUpdated() {
		if (!bundlesRep) {
			bundlesRep = window.NodeCG.Replicant("bundles", "nodecg");
			bundlesRep.setMaxListeners(99);
		}

		bundlesRep.on("change", () => {
			this._updateBundleInfo();
		});
	}

	override updated(changedProps: Map<string, unknown>) {
		if (changedProps.has("instance")) {
			this._updateBundleInfo();
		}
	}

	private close() {
		this.dispatchEvent(new CustomEvent("close"));
	}

	private _updateBundleInfo() {
		if (bundlesRep?.status !== "declared" || !Array.isArray(bundlesRep.value)) return;
		if (!this.instance?.bundleName) return;

		const bundle = bundlesRep.value.find(
			(b) => b.name === this.instance!.bundleName,
		);
		if (!bundle) return;

		this._bundleVersion = bundle.version;
		this._bundleGit = bundle.git;
	}

	private _formatCommitMessage(message: string | undefined) {
		if (!message) return "[No commit message.]";
		if (message.length > 50) return `[${message.slice(0, 50)}…]`;
		return `[${message}]`;
	}

	override render() {
		return html`
			<button @click=${this.close}>${icon("close")}</button>
			<div id="body">
				<div class="line" style="margin-bottom: 4px;">
					<span class="orange">Current:</span>
					<span class="details">
						${this.instance?.bundleVersion} -
						${this.instance?.bundleGit?.shortHash}
						${this._formatCommitMessage((this.instance?.bundleGit as any)?.message)}
					</span>
				</div>
				<div class="line" style="margin-top: 4px;">
					<span class="green">Latest:&nbsp;</span>
					<span class="details">
						${this._bundleVersion} - ${this._bundleGit?.shortHash}
						${this._formatCommitMessage((this._bundleGit as any)?.message)}
					</span>
				</div>
			</div>
		`;
	}
}

customElements.define("ncg-graphic-instance-diff", NcgGraphicInstanceDiff);
