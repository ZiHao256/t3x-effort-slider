# Effort slider（推理强度滑条）

Replaces the reasoning effort list in the composer with a stepped slider; higher levels make the stars brighter and faster, and the top level adds a flowing nebula.

把输入框推理强度面板里的档位列表换成分档滑条，档位越高星点越亮越快，最高档流动星云。

![The reasoning effort slider at the top and bottom levels](docs/effort-slider.png)

![Stars get brighter and faster at higher levels](docs/effort-slider-levels.png)

An extension for [T3 Code Extensions](https://github.com/ZiHao256/t3code-extensions), an unofficial extension host for [T3 Code](https://github.com/pingdotgg/t3code). Install it in Settings → Extensions → Browse, or paste `https://github.com/ZiHao256/t3x-effort-slider` into the URL field there. "Check for updates" offers this repository's latest release, installed after you confirm.

[T3 Code Extensions](https://github.com/ZiHao256/t3code-extensions) 的扩展。在 设置 → 扩展 →“浏览”里安装，或者把 `https://github.com/ZiHao256/t3x-effort-slider` 粘贴到那里的链接框。“检查更新”取本仓库的最新 Release。

## Install with an agent / 让 agent 安装

Paste this to Claude Code, Codex or another coding agent. 把下面的提示词发给 Claude Code、Codex 等 coding agent。

```text
Install the T3 Code extension "Effort slider" (https://github.com/ZiHao256/t3x-effort-slider) on this Mac.
1. Check that T3 Code Extensions is installed. If it isn't, install it first by following the "Install with an agent" section of https://github.com/ZiHao256/t3code-extensions, and ask me before quitting T3 Code.
2. Open ~/Applications/T3 Code Extensions.app, go to Settings → Extensions → Browse, and install "t3x-effort-slider" from the community list, or paste https://github.com/ZiHao256/t3x-effort-slider into the link field and click Add. In the confirmation dialog, check that the source is ZiHao256/t3x-effort-slider before confirming.
3. In the Installed tab, make sure it is enabled and tell me its version.
If you can't operate the app's UI, do step 1, then tell me exactly what to click for steps 2 and 3.
```

```text
帮我在这台 Mac 上给 T3 Code 装「推理强度滑条」扩展（https://github.com/ZiHao256/t3x-effort-slider）。
1. 确认已安装 T3 Code Extensions。没装的话，先按 https://github.com/ZiHao256/t3code-extensions 里「让 agent 安装」一节装好；要退出 T3 Code 前先问我。
2. 打开 ~/Applications/T3 Code Extensions.app，进入 设置 → 扩展 →「浏览」，在社区扩展里安装 t3x-effort-slider；或者把 https://github.com/ZiHao256/t3x-effort-slider 粘贴到链接框里点「添加」。确认框里核对来源是 ZiHao256/t3x-effort-slider 再确认。
3. 在「已安装」里确认它已启用，告诉我版本号。
如果你没法操作应用界面，做完第 1 步后，把第 2、3 步具体点哪里告诉我。
```

## Requirements / 依赖

`apiVersion` 2: needs a T3 Code Extensions host that supports it. Older hosts refuse to install this version.

只依赖宿主提供的 `host` 接口（`apiVersion` 2），旧版宿主会拒绝安装。

## Development / 开发

- `npm test` runs the tests (Node 22+, no dependencies). 运行测试，不依赖 npm 包。
- To try changes: Settings → Extensions → Add local extension, pick this folder, then click refresh on its card after each edit. 试改动：设置 → 扩展 →“添加本地扩展”选本仓库目录，改完点卡片上的刷新。

## Release / 发版

1. Change the code, bump `version` in `plugin.json`, run `npm test`, and commit. 改代码和 `plugin.json` 的 `version`，跑测试，提交。
2. Tag that commit `v<version>`, push it with the tag, and publish a GitHub release ("check for updates" reads the latest release). 在这个提交上打 `v<version>` 标签，连标签一起推送并发布 Release（“检查更新”看的是最新 Release）。

## License

MIT
