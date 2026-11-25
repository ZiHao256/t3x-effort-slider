# Effort slider（推理强度滑条）

Replaces the reasoning effort list in the composer with a stepped slider; higher levels make the stars brighter and faster, and the top level adds a flowing nebula.

把输入框推理强度面板里的档位列表换成分档滑条，档位越高星点越亮越快，最高档流动星云。

An extension for [T3 Code Extensions](https://github.com/ZiHao256/t3code-extensions), an unofficial extension host for [T3 Code](https://github.com/pingdotgg/t3code). This repository is the source of truth. T3 Code Extensions includes it as a git submodule (`extensions/effort-slider`) to ship it as a built-in, and checks this repository's latest release for updates.

[T3 Code Extensions](https://github.com/ZiHao256/t3code-extensions) 的扩展，源码就在本仓库。T3 Code Extensions 通过 git submodule（`extensions/effort-slider`）引用本仓库作为内置扩展，并从本仓库的最新 Release 检查更新。

## Requirements / 依赖

`apiVersion` 2: needs a T3 Code Extensions host that supports it. Older hosts refuse to install this version.

只依赖宿主提供的 `host` 接口（`apiVersion` 2），旧版宿主会拒绝安装。

## Development / 开发

- `npm test` runs the tests (Node 22+, no dependencies). 运行测试，不依赖 npm 包。
- In a T3 Code Extensions checkout, `extensions/effort-slider` is this repository: edit there, then reinstall T3 Code Extensions to try it. 在 T3 Code Extensions 仓库里，`extensions/effort-slider` 就是本仓库：在那里改，重装后生效。

## Release / 发版

1. Change the code, bump `version` in `plugin.json`, run `npm test`, and commit. 改代码和 `plugin.json` 的 `version`，跑测试，提交。
2. Tag that commit `v<version>`, push it with the tag, and publish a GitHub release ("check for updates" reads the latest release). 在这个提交上打 `v<version>` 标签，连标签一起推送并发布 Release（“检查更新”看的是最新 Release）。
3. In T3 Code Extensions: `git add extensions/effort-slider`, `node lib/build.cjs`, `npm test`, then commit the submodule pointer together with `registry/index.json`. 在 T3 Code Extensions 里更新 submodule 指向、重新生成注册表、跑测试，两者一起提交。

## License

MIT
