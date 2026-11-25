// 推理强度滑条：替换 composer.effort（原生的档位单选列表）。
// 竖向布局（最高档在上，最低档在下）：左侧原生竖向填充轨 + 星点 + 刻度 + 滑块，右侧与刻度齐平的可点档位行；
// 拖动走连续坐标并在松手吸附到最近档位，键盘步进和读屏交互交给盖在轨道上的透明原生 <input type="range">。
const { React, h } = host;

// 星点动效：跟随档位（越高越快越亮）/ 静态 / 关闭。系统“减弱动态效果”时一律静态。
const MOTION = () => ({ level: host.t("跟随档位", "Match reasoning effort"), static: host.t("静态", "Static"), off: host.t("关闭", "Off") });

// 星点漂移、闪烁和最高档流动都是 WAAPI 合成器动画（只动 transform / opacity），不在主线程每帧重绘。
// 动画以最高档（最快）时长按 steps 创建一次，换档或拖动只通过 updatePlaybackRate 调速，星点不会跳回起点。
// 所有动画共用同一个速率和起点，步进落在同一时刻：每一步都会让整个窗口重新合成一帧，步进错开时实测 GPU 进程从约 19% 涨到约 30%。
// 20fps：星点漂移每步不到 0.5px，看不出和 30fps 的差别；再降到 15fps 实测省不了多少。
const FRAME_MS = 1000 / 20;
const BASE_DRIFT = { a: 7, b: 11 };
const BASE_TWINKLE = { a: [2.4, 0.46, 0], b: [3.1, 0.42, -36 * FRAME_MS] };

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// 归一化位置（0=底端圆帽圆心，1=顶端圆帽圆心）；具体像素由 CSS 用轨道半径精确推导，任意高度下都不穿模。
const posAt = (i, n) => (n <= 1 ? 0.5 : i / (n - 1));
const indexFromPos = (p, n) => (n <= 1 ? 0 : Math.round(clamp01(p) * (n - 1)));

function frameLoop(node, keyframes, sec, opts) {
  const n = Math.max(1, Math.round((sec * 1000) / FRAME_MS));
  return node.animate(keyframes, { duration: n * FRAME_MS, iterations: Infinity, easing: `steps(${n})`, ...opts });
}

function setRate(anim, rate) {
  if (typeof anim.updatePlaybackRate === "function") anim.updatePlaybackRate(rate);
  else anim.playbackRate = rate;
}

// 最高档原速，最低的非零档约半速。
const rateFor = (level) => 1 / (2 - clamp01(level));

/** 创建持久的 WAAPI 星点控制器：只建一次动画，后续仅调速或暂停/恢复，避免换档星点重置。 */
function createMotion(fill) {
  const all = [];
  for (const layer of fill.querySelectorAll(".t3x-stars")) {
    const name = layer.dataset.layer;
    for (const star of layer.querySelectorAll(".t3x-star")) {
      // 每张星图的竖向平铺高度为不同质数，向上漂移一个周期后和起点重合，循环无缝
      const tile = parseFloat(getComputedStyle(star).getPropertyValue("--t3x-tile")) || 47;
      all.push(frameLoop(star, [{ transform: "translateY(0)" }, { transform: `translateY(${-tile}px)` }], BASE_DRIFT[name]));
    }
    const [sec, low, delay] = BASE_TWINKLE[name];
    all.push(frameLoop(layer.firstChild, [{ opacity: 1, easing: "ease-in-out" }, { opacity: low, easing: "ease-in-out" }, { opacity: 1 }], sec, { delay }));
  }
  const t0 = document.timeline.currentTime;
  for (const a of all) a.startTime = t0;
  let flow = null;
  let lastLevel = null;
  let rate = 1;
  // 流动层后建、单独暂停过：恢复时把进度对齐到其他动画，步进才落在同一时刻（流动层这时正从透明渐显，看不出跳变）。
  // 其他动画的调速要到下一帧才生效，等它们就绪后再对齐起点和速率。
  // 回调到时流动层可能已被暂停或取消（换档、关面板）：用代次作废旧请求，取消导致的 AbortError 不算错误。
  let alignGen = 0;
  const alignFlow = () => {
    const f = flow;
    const gen = ++alignGen;
    Promise.all(all.map((a) => a.ready))
      .then(() => {
        if (gen !== alignGen || f !== flow || f.playState !== "running" || !all[0] || all[0].startTime === null) return;
        f.playbackRate = all[0].playbackRate;
        f.startTime = all[0].startTime;
      })
      .catch((error) => {
        if (error?.name !== "AbortError") throw error;
      });
  };

  return {
    sync(level, flowActive) {
      if (level > 0) {
        if (lastLevel === null || Math.abs(level - lastLevel) > 0.004) {
          rate = rateFor(level);
          for (const a of all) setRate(a, rate);
          if (flow) setRate(flow, rate);
          lastLevel = level;
        }
        for (const a of all) if (a.playState === "paused") a.play();
      } else {
        for (const a of all) if (a.playState !== "paused") a.pause();
      }

      if (flowActive) {
        if (!flow) {
          const node = fill.querySelector(".t3x-slider-flow");
          if (node) {
            flow = frameLoop(node, [{ transform: "translateY(0)", easing: "ease-in-out" }, { transform: "translateY(-31.03%)" }], 4, { direction: "alternate" });
            alignFlow();
          }
        } else if (flow.playState === "paused") {
          alignFlow();
          flow.play();
        }
      } else if (flow && flow.playState !== "paused") {
        alignGen += 1;
        flow.pause();
      }
    },
    cancel() {
      alignGen += 1;
      for (const a of all) a.cancel();
      flow?.cancel();
    },
  };
}

const starLayer = (name) =>
  h(
    "span",
    { className: "t3x-stars", "data-layer": name },
    h(
      "span",
      { className: "t3x-twinkle" },
      [0, 1, 2, 3].map((i) => h("span", { key: i, className: "t3x-star" })),
    ),
  );

function useReducedMotion() {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const [reduced, setReduced] = React.useState(() => query?.matches === true);
  React.useEffect(() => {
    const sync = () => setReduced(query.matches);
    query?.addEventListener?.("change", sync);
    return () => query?.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

function EffortSlider({ label, steps, activeIndex, disabled, select }) {
  host.useLang();
  const trackRef = React.useRef(null);
  const fillRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const motionRef = React.useRef(null);
  const dragRef = React.useRef({ pointerId: null, startY: 0, moved: false });
  const [dragPos, setDragPos] = React.useState(null);
  const reduced = useReducedMotion();
  const motion = host.storage.use("motion", "level");
  const n = steps.length;
  const index = Math.max(0, Math.min(n - 1, activeIndex));
  const activeDragPos = disabled ? null : dragPos;
  const dragging = activeDragPos !== null;
  const pos = dragging ? activeDragPos : posAt(index, n);
  const displayIndex = dragging ? indexFromPos(pos, n) : index;
  const level = n > 1 ? pos : 0;
  const isMax = n > 1 && displayIndex === n - 1;
  // 最高档流动星云仅在逼近最高档区间渐显，避免低中高档无谓叠加
  const flowOpacity = n > 1 ? clamp01((level - (n - 2) / (n - 1)) * (n - 1)) : 0;
  const flowActive = flowOpacity > 0;

  // 只在开启“跟随档位”且非减弱动态效果时维持同一组动画；0 档不启动也不保留运行中动画。
  React.useEffect(() => {
    if (reduced || motion !== "level") {
      motionRef.current?.cancel();
      motionRef.current = null;
      return;
    }
    if (!fillRef.current) return;
    if (level <= 0 && !flowActive) {
      motionRef.current?.sync(0, false);
      return;
    }
    if (!motionRef.current) motionRef.current = createMotion(fillRef.current);
    motionRef.current.sync(level, flowActive);
  }, [level, flowActive, reduced, motion]);

  React.useEffect(
    () => () => {
      motionRef.current?.cancel();
      motionRef.current = null;
    },
    [],
  );

  // 面板在捕获阶段拦下上下方向键去切换焦点行，还会阻止默认动作；竖滑条要用上下键调档，
  // 所以在更早的 window 捕获阶段截住，交给原生 range 处理。到了最高 / 最低档再放行给面板。
  React.useEffect(() => {
    const onKey = (ev) => {
      if (ev.target !== inputRef.current) return;
      const value = Number(ev.target.value);
      if ((ev.key === "ArrowUp" && value < n - 1) || (ev.key === "ArrowDown" && value > 0)) ev.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [n]);

  const posFromClientY = (clientY) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return posAt(index, n);
    const cap = rect.width / 2;
    const span = rect.height - rect.width;
    if (span <= 0) return 0.5;
    return clamp01((rect.bottom - cap - clientY) / span);
  };

  // 原生 range 的 step=1 会导致指针拖动按整档跳变；这里拦截指针走连续跟手，松手吸附最近档，
  // 同时保留原生 range 的 step=1 给键盘步进和读屏器。
  const onPointerDown = (ev) => {
    // 已有指针在拖时忽略第二根；拿不到指针捕获就交回原生 range 处理，免得松手落在轨道外时拖动状态卡住。
    if (disabled || n <= 1 || (ev.pointerType === "mouse" && ev.button !== 0) || dragRef.current.pointerId != null) return;
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch {
      return;
    }
    ev.preventDefault();
    ev.currentTarget.focus({ preventScroll: true });
    dragRef.current = { pointerId: ev.pointerId, startY: ev.clientY, moved: false };
  };

  const onPointerMove = (ev) => {
    const d = dragRef.current;
    if (d.pointerId !== ev.pointerId) return;
    if (!d.moved && Math.abs(ev.clientY - d.startY) >= 2) d.moved = true;
    if (d.moved) setDragPos(posFromClientY(ev.clientY));
  };

  const onPointerUp = (ev) => {
    const d = dragRef.current;
    if (d.pointerId !== ev.pointerId) return;
    d.pointerId = null;
    const target = indexFromPos(posFromClientY(ev.clientY), n);
    setDragPos(null);
    select(target);
  };

  const onPointerAbort = (ev) => {
    if (dragRef.current.pointerId !== ev.pointerId) return;
    dragRef.current.pointerId = null;
    setDragPos(null);
  };

  const dotState = (i) => {
    if (!dragging) return i < index ? "filled" : i === index ? "active" : "empty";
    const p = posAt(i, n);
    if (Math.abs(p - pos) <= 0.04) return "active";
    return p < pos ? "filled" : "empty";
  };

  const hint = steps[displayIndex]?.description;
  return h(
    "div",
    { className: "t3x-effort", "data-disabled": disabled ? "true" : undefined },
    h(
      "div",
      {
        className: "t3x-effort-body",
        "data-max": isMax ? "true" : undefined,
        style: { "--t3x-count": n },
      },
      h(
        "div",
        {
          ref: trackRef,
          className: "t3x-slider-track",
          "data-level": displayIndex,
          "data-count": n,
          "data-max": isMax ? "true" : undefined,
          "data-dragging": dragging ? "true" : undefined,
          "data-motion": motion,
          style: { "--t3x-level": level, "--t3x-pos": pos, "--t3x-flow": flowOpacity },
        },
        h(
          "div",
          { ref: fillRef, className: "t3x-slider-fill" },
          h("span", { className: "t3x-slider-flow" }),
          h("span", { className: "t3x-star-field" }, starLayer("a"), starLayer("b")),
        ),
        steps.map((s, i) =>
          h("span", {
            key: s.id,
            className: "t3x-slider-dot",
            "data-state": dotState(i),
            style: { "--t3x-pos": posAt(i, n) },
          }),
        ),
        h("div", { className: "t3x-slider-thumb" }),
        h("input", {
          ref: inputRef,
          className: "t3x-slider-input",
          type: "range",
          min: 0,
          max: Math.max(0, n - 1),
          step: 1,
          value: displayIndex,
          disabled,
          "aria-label": label || host.t("推理强度", "Reasoning effort"),
          "aria-valuetext": steps[displayIndex]?.isDefault
            ? host.t(`${steps[displayIndex].label ?? ""}（默认）`, `${steps[displayIndex].label ?? ""} (default)`)
            : steps[displayIndex]?.label ?? "",
          "data-effort-row": true, // 让面板的上下方向键能把焦点移到滑条上
          "data-effort-level": true, // 原生面板选完模型后按这个属性把焦点放进档位控件
          onChange: (ev) => select(Number(ev.target.value)),
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerAbort,
          onLostPointerCapture: onPointerAbort,
        }),
      ),
      // 档位行只给鼠标点；键盘和读屏走原生 range 的 aria-valuetext。
      h(
        "div",
        { className: "t3x-effort-labels", "aria-hidden": true },
        steps.map((s, i) =>
          h(
            "div",
            {
              key: s.id,
              className: "t3x-effort-label",
              "data-active": i === displayIndex ? "true" : undefined,
              style: { "--t3x-pos": posAt(i, n) },
              onClick: disabled ? undefined : () => select(i),
            },
            h("span", { className: "t3x-effort-name" }, s.label),
            s.isDefault ? h("span", { className: "t3x-effort-default" }, host.t("默认", "Default")) : null,
          ),
        ),
      ),
    ),
    hint ? h("p", { className: "t3x-effort-hint" }, hint) : null,
  );
}

function Settings({ ui }) {
  host.useLang();
  const options = MOTION();
  const saved = host.storage.use("motion", "level");
  const current = Object.hasOwn(options, saved) ? saved : "level";
  return h(
    ui.Section,
    { title: host.t("外观与动效", "Appearance & animation") },
    h(ui.Row, {
      title: host.t("星点动效", "Star animation"),
      description: host.t(
        "控制滑条轨道内的星尘与最高档流光效果；系统开启“减弱动态效果”时会自动保持静态。",
        "Control star particles and max-level nebula glow inside the slider track. Stays static when system Reduced Motion is enabled.",
      ),
      control: h(
        ui.Select,
        {
          value: current,
          onValueChange: (v) => {
            if (v && Object.hasOwn(options, v)) host.storage.set("motion", v);
          },
        },
        h(
          ui.SelectTrigger,
          { size: "sm", className: "w-full sm:w-52", "aria-label": host.t("星点动效", "Star animation") },
          h(ui.SelectValue, null, options[current]),
        ),
        h(
          ui.SelectPopup,
          { align: "end", alignItemWithTrigger: false },
          Object.entries(options).map(([id, text]) => h(ui.SelectItem, { key: id, value: id }, text)),
        ),
      ),
    }),
  );
}

host.register("composer.effort", EffortSlider);
host.settings(Settings);
