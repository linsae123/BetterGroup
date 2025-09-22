/**
 * @name BetterGroup
 * @description Group - Plugins
 * @version 1.0.0
 * @author linsae123
 */

module.exports = class BetterGroup {
    constructor() {
        this.token = null;
        this.panel = null;
        this.uiToggleButton = null;
        this.buttonObserver = null;

        this.settings = {};
        this.defaultSettings = {
        changeNameOnSend: false,
        };

        this.ChannelStore = BdApi.findModuleByProps("getChannel", "hasChannel");
        this.SelectedChannelStore = BdApi.findModuleByProps(
        "getLastSelectedChannelId"
        );
        this.MessageActions = BdApi.findModuleByProps(
        "sendMessage",
        "deleteMessage"
        );
    }

    start() {
        this.loadSettings();
        this.getToken();
        this.injectPanel();
        this.createAndObserveToggleButton();
        this.applyMessagePatch();
    }

    stop() {
        BdApi.Patcher.unpatchAll("BetterGroup");
        if (this.panel) this.panel.remove();
        if (this.buttonObserver) this.buttonObserver.disconnect();
        if (this.uiToggleButton) this.uiToggleButton.remove();
    }

    loadSettings() {
        this.settings = BdApi.Data.load("BetterGroup", "settings") || {
        ...this.defaultSettings,
        };
    }

    saveSettings() {
        BdApi.Data.save("BetterGroup", "settings", this.settings);
    }

    applyMessagePatch() {
        if (!this.MessageActions) return;

        BdApi.Patcher.before(
        "BetterGroup",
        this.MessageActions,
        "sendMessage",
        (_, args) => {
            if (!this.settings.changeNameOnSend) return;
            const channelId = args[0];
            const channel = this.ChannelStore.getChannel(channelId);
            if (channel?.type !== 3) return;

            const message = args[1];
            const content = message.content?.trim();
            if (!content || content.startsWith("/")) return;

            this.ChangeGroupName(channelId, content);
            message.content = "";
        }
        );
    }

    createAndObserveToggleButton() {
        const selector = 'form [class^="buttons_"]';
        const insert = (container) => {
        if (document.getElementById("bettergroup-ui-toggle-button")) return;
        const wrapper = document.createElement("div");
        wrapper.id = "bettergroup-ui-toggle-button";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bettergroup-toggle-button";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;
        btn.onclick = () => {
            if (!this.panel || !document.body.contains(this.panel))
            this.injectPanel();
            const currentChannelId = this.SelectedChannelStore.getChannelId();
            const channelIdInput = this.panel.querySelector(
            "#bettergroup-channel-id"
            );
            if (channelIdInput) channelIdInput.value = currentChannelId;
            this.panel.style.display =
            this.panel.style.display === "none" ? "flex" : "none";
        };
        wrapper.appendChild(btn);
        const giftBtn = container.querySelector(
            '[aria-label*="Gift"], [aria-label*="선물"]'
        );
        if (giftBtn) giftBtn.parentElement.insertBefore(wrapper, giftBtn);
        else container.insertBefore(wrapper, container.firstChild);
        this.uiToggleButton = wrapper;

        if (!document.getElementById("bettergroup-style-toggle")) {
            const style = document.createElement("style");
            style.id = "bettergroup-style-toggle";
            style.innerHTML = `.bettergroup-toggle-button { background: 0; border: 0; padding: 0; border-radius: 4px; display:flex; align-items:center; cursor: pointer; margin: 0 4px; } .bettergroup-toggle-button svg { color: var(--interactive-normal); transition: color 0.2s; } .bettergroup-toggle-button:hover svg { color: var(--interactive-hover); }`;
            document.head.appendChild(style);
        }
        };
        this.buttonObserver = new MutationObserver(() => {
        const channelId = this.SelectedChannelStore.getChannelId();
        const channel = this.ChannelStore.getChannel(channelId);
        const container = document.querySelector(selector);
        if (container && channel?.type === 3) insert(container);
        else if (this.uiToggleButton) {
            this.uiToggleButton.remove();
            this.uiToggleButton = null;
        }
        });
        this.buttonObserver.observe(document.body, {
        childList: true,
        subtree: true,
        });
    }

    async apiRequest(url, method, body) {
        if (!this.token) {
        BdApi.UI.showToast("인증 토큰을 찾을 수 없어요.", { type: "error" });
        return null;
        }
        try {
        const headers = {
            authorization: this.token,
        };
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) return response;

        const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP 오류: ${response.status}` }));
        BdApi.UI.showToast(`API 오류: ${errorData.message}`, { type: "error" });
        return null;
        } catch (error) {
        BdApi.UI.showToast(`네트워크 요청 오류가 발생했어요.`, { type: "error" });
        return null;
        }
    }

    async GroupKick(channel_id, user_id) {
        const response = await this.apiRequest(
        `https://discord.com/api/v9/channels/${channel_id}/recipients/${user_id}`,
        "DELETE"
        );
        if (response)
        BdApi.UI.showToast(`그룹에서 사용자를 추방했어요.`, { type: "success" });
    }

    async InviteGroup(channel_id, user_id) {
        const response = await this.apiRequest(
        `https://discord.com/api/v9/channels/${channel_id}/recipients/${user_id}`,
        "PUT"
        );
        if (response)
        BdApi.UI.showToast(`그룹에 사용자를 초대했어요.`, { type: "success" });
    }

    async ChangeGroupName(channel_id, name) {
        const response = await this.apiRequest(
        `https://discord.com/api/v9/channels/${channel_id}`,
        "PATCH",
        { name }
        );
        if (response)
        BdApi.UI.showToast(`그룹 이름이 '${name}'(으)로 변경되었어요.`, {
            type: "success",
        });
    }

    async ChangeCallRegion(channel_id, region) {
        const response = await this.apiRequest(
        `https://discord.com/api/v9/channels/${channel_id}/call`,
        "PATCH",
        { region }
        );
        if (response)
        BdApi.UI.showToast(`모든 사람을 재접속 시켰어요.`, { type: "success" });
    }

    getToken() {
        BdApi.Patcher.before(
        "BetterGroup",
        XMLHttpRequest.prototype,
        "setRequestHeader",
        (thisObject, [header, value]) => {
            if (header.toLowerCase() === "authorization" && value)
            this.handleTokenFound(value);
        }
        );
    }

    handleTokenFound(token) {
        if (this.token !== token) {
        this.token = token;
        }
    }

    injectPanel() {
        if (document.getElementById("BetterGroupPanel")) return;

        const panel = document.createElement("div");
        panel.id = "BetterGroupPanel";
        this.panel = panel;

        const createInput = (id, label, desc, placeholder) =>
        `<div class="setting-row vertical"><div class="setting-label"><div class="label-text">${label}</div><div class="label-description">${desc}</div></div><input type="text" id="bettergroup-${id}" placeholder="${placeholder}" class="text-input" value=""></div>`;
        const createButton = (id, text, style = "primary") =>
        `<button id="bettergroup-${id}" class="lunar-button lunar-button-${style}">${text}</button>`;
        const createDivider = () => `<div class="divider"></div>`;
        const createToggle = (id, label, desc, key) =>
        `<div class="setting-row"><div class="setting-label"><div class="label-text">${label}</div><div class="label-description">${desc}</div></div><div class="toggle-switch"><input type="checkbox" id="bettergroup-${id}" ${
            this.settings[key] ? "checked" : ""
        }><span class="slider"></span></div></div>`;

        panel.innerHTML = `
                    <style>
                        :root { --lunar-accent: #2980B9; --lunar-bg: rgba(20, 20, 23, 0.85); --lunar-secondary-bg: rgba(30, 30, 34, 0.7); --lunar-border: rgba(255, 255, 255, 0.08); --lunar-text-primary: #FFFFFF; --lunar-text-secondary: #A0A0B0; --lunar-text-muted: #6B6B78; --lunar-danger: #e74c3c; --lunar-gradient-start: #2980B9; --lunar-gradient-end: #87CEEB; }
                        #BetterGroupPanel { position: fixed; top: 100px; left: 100px; z-index: 1001; background: var(--lunar-bg); backdrop-filter: blur(12px) saturate(180%); border-radius: 12px; border: 1px solid var(--lunar-border); width: 420px; color: var(--lunar-text-primary); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37); display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
                        .titlebar { padding: 12px 16px; cursor: move; border-bottom: 1px solid var(--lunar-border); display: flex; justify-content: space-between; align-items: center; }
                        .titlebar-title { font-size: 20px; font-weight: 600; }
                        .close-btn { width: 22px; height: 22px; border-radius: 50%; background: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: .2s; } .close-btn:hover { transform: scale(1.1); } .close-btn::before { content: '×'; font-size: 16px; color: var(--lunar-text-secondary); }
                        .content-wrapper { padding: 16px; }
                        .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; } .setting-row:last-child { margin-bottom: 0; } .setting-row.vertical { flex-direction: column; align-items: flex-start; }
                        .setting-label { flex-grow: 1; } .label-text { font-size: 16px; font-weight: 500; } .label-description { font-size: 13px; color: var(--lunar-text-muted); margin-top: 2px; }
                        .vertical > .text-input { margin-top: 12px; width: 100%; }
                        .text-input { width: 100%; box-sizing: border-box; background: var(--lunar-secondary-bg); border: 1px solid var(--lunar-border); border-radius: 6px; padding: 10px; color: var(--lunar-text-primary); font-size: 14px; transition: .2s; } .text-input:focus { border-color: var(--lunar-accent); box-shadow: 0 0 10px -2px var(--lunar-accent); }
                        .lunar-button { padding: 8px 16px; border: 1px solid var(--lunar-accent); border-radius: 6px; font-weight: 600; cursor: pointer; transition: .2s; color: var(--lunar-accent); background: transparent; text-align: center; margin-top: 10px;} .lunar-button:hover { background-color: var(--lunar-accent); color: white; box-shadow: 0 0 10px var(--lunar-accent); }
                        .lunar-button-danger { border-color: var(--lunar-danger); color: var(--lunar-danger); } .lunar-button-danger:hover { background-color: var(--lunar-danger); color: white; }
                        .button-group { display: flex; gap: 10px; width: 100%; } .button-group > .lunar-button { flex-grow: 1; }
                        .divider { border-top: 1px solid var(--lunar-border); margin: 24px 0; }
                        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; } .toggle-switch input { opacity: 0; width: 100%; height: 100%; position: absolute; z-index: 1; cursor: pointer; }
                        .toggle-switch .slider { position: absolute; inset: 0; background-color: var(--lunar-secondary-bg); border-radius: 34px; transition: .4s; }
                        .toggle-switch .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .4s; }
                        .toggle-switch input:checked + .slider { background-image: linear-gradient(to right, var(--lunar-gradient-start), var(--lunar-gradient-end)); } .toggle-switch input:checked + .slider:before { transform: translateX(20px); }
                    </style>
                    <div class="titlebar"><h1 class="titlebar-title">BetterGroup</h1><div id="bettergroup-close-btn" class="close-btn"></div></div>
                    <div class="content-wrapper">
                        ${createInput(
                        "channel-id",
                        "그룹 채널 ID",
                        "대상 그룹(DM)의 채널 ID입니다.",
                        "자동으로 입력됩니다."
                        )}
                        ${createDivider()}
                        ${createInput(
                        "user-id",
                        "사용자 ID",
                        "초대하거나 추방할 사용자의 ID입니다.",
                        "사용자 ID 입력"
                        )}
                        <div class="button-group">
                            ${createButton("invite-user", "초대", "primary")}
                            ${createButton("kick-user", "추방", "danger")}
                        </div>
                        ${createDivider()}
                        <div class="setting-label" style="margin-bottom: 16px;"><div class="label-text">통화방 모두 재접속</div><div class="label-description">통화방의 지역을 임의로 변경하여 모두를 재연결시킵니다.</div></div>
                        ${createButton("change-region", "모두 재접속", "primary")}
                        ${createDivider()}
                        ${createToggle(
                        "change-name-on-send",
                        "그룹 이름 변경",
                        "활성화 시, 메시지 전송으로 그룹 이름을 변경합니다.",
                        "changeNameOnSend"
                        )}
                    </div>`;
        panel.style.display = "none";
        document.body.appendChild(panel);
        this.setupEventListeners(panel);
    }

    setupEventListeners(panel) {
        panel
        .querySelector("#bettergroup-close-btn")
        ?.addEventListener("click", () => {
            if (this.panel) this.panel.style.display = "none";
        });
        const titlebar = panel.querySelector(".titlebar");
        let isDragging = false,
        x,
        y;
        titlebar?.addEventListener("mousedown", (e) => {
        isDragging = true;
        x = e.clientX - panel.getBoundingClientRect().left;
        y = e.clientY - panel.getBoundingClientRect().top;
        });
        document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - x}px`;
            panel.style.top = `${e.clientY - y}px`;
        }
        });
        document.addEventListener("mouseup", () => (isDragging = false));

        const channelIdInput = panel.querySelector("#bettergroup-channel-id");
        const userIdInput = panel.querySelector("#bettergroup-user-id");
        const changeNameToggle = panel.querySelector(
        "#bettergroup-change-name-on-send"
        );
        const changeRegionBtn = panel.querySelector("#bettergroup-change-region");

        panel
        .querySelector("#bettergroup-kick-user")
        ?.addEventListener("click", () => {
            const channelId = channelIdInput.value.trim(),
            userId = userIdInput.value.trim();
            if (channelId && userId) this.GroupKick(channelId, userId);
            else
            BdApi.UI.showToast("채널 ID와 사용자 ID를 모두 입력해주세요.", {
                type: "error",
            });
        });
        panel
        .querySelector("#bettergroup-invite-user")
        ?.addEventListener("click", () => {
            const channelId = channelIdInput.value.trim(),
            userId = userIdInput.value.trim();
            if (channelId && userId) this.InviteGroup(channelId, userId);
            else
            BdApi.UI.showToast("채널 ID와 사용자 ID를 모두 입력해주세요.", {
                type: "error",
            });
        });
        changeNameToggle?.addEventListener("change", (e) => {
        this.settings.changeNameOnSend = e.target.checked;
        this.saveSettings();
        BdApi.UI.showToast(
            `메시지로 이름 변경 ${e.target.checked ? "활성화" : "비활성화"}`,
            { type: "info" }
        );
        });
        changeRegionBtn?.addEventListener("click", () => {
        const channelId = channelIdInput.value.trim();
        if (channelId) this.ChangeCallRegion(channelId, "us-west");
        else BdApi.UI.showToast("채널 ID를 확인해주세요.", { type: "error" });
        });
    }
};
