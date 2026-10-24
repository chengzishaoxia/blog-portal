import request from '@/utils/request';

// 内部管理 WebSocket 地址，不再通过外部传入
const envWs = import.meta.env.VITE_CHAT_WS || 'ws://localhost:18080/ws/chat';

export interface ChatMessage {
    type: string;
    fromUserId?: number | string;
    fromUsername?: string;
    fromNickname?: string; // 新增：发送者昵称
    fromAvatar?: string;
    toUserId?: number;
    content?: string; // 文本或图片 URL
    timestamp?: number;
    error?: string;
    isPrivate?: boolean;
    // 可选：图片尺寸元信息（后端未来可返回）
    width?: number;
    height?: number;
}

export interface ChatSocketOptions {
    // 移除 token: Sa-Token cookie 自动鉴权
    heartbeatInterval?: number;
    reconnectBaseDelay?: number;
    maxReconnectDelay?: number;
    historyLimit?: number;
}

type Consumer<T> = (p: T) => void;

export class ChatSocketService {
    private ws: WebSocket | null = null;
    private opts: Required<ChatSocketOptions>;
    private heartbeatTimer: any = null;
    private reconnectTimer: any = null;
    private reconnectAttempts = 0;
    private manualClose = false;

    private messageListeners: Consumer<ChatMessage>[] = [];
    private openListeners: Consumer<Event>[] = [];
    private closeListeners: Consumer<CloseEvent>[] = [];
    private errorListeners: Consumer<Event>[] = [];
    private onlineUsersListeners: Consumer<number[]>[] = [];
    private onlineUserSet: Set<number> = new Set(); // 新增：在线用户集合基于 JOIN/LEAVE 构建

    constructor(options: ChatSocketOptions) {
        this.opts = {
            heartbeatInterval: 30000,
            reconnectBaseDelay: 1500,
            maxReconnectDelay: 15000,
            historyLimit: 50,
            ...options
        } as Required<ChatSocketOptions>;
    }

    onMessage(cb: Consumer<ChatMessage>) {
        this.messageListeners.push(cb);
    }

    onOpen(cb: Consumer<Event>) {
        this.openListeners.push(cb);
    }

    onClose(cb: Consumer<CloseEvent>) {
        this.closeListeners.push(cb);
    }

    onError(cb: Consumer<Event>) {
        this.errorListeners.push(cb);
    }

    onOnlineUsers(cb: Consumer<number[]>) {
        this.onlineUsersListeners.push(cb);
    }

    private emit<T>(arr: Consumer<T>[], payload: T) {
        arr.forEach(fn => {
            try {
                fn(payload);
            } catch {
            }
        });
    }

    connect() {
        this.manualClose = false;
        // 不再在 URL 上拼 token
        const url = `${envWs}`;
        this.ws = new WebSocket(url);
        this.ws.onopen = (evt) => {
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.emit(this.openListeners, evt);
        };
        this.ws.onmessage = (evt) => {
            try {
                const msg: ChatMessage = JSON.parse(evt.data);
                if (msg.type === 'PONG') return;
                this.emit(this.messageListeners, msg);
                // 基于 JOIN/LEAVE 更新在线用户集合
                if (msg.type === 'JOIN' && msg.fromUserId != null) {
                    this.onlineUserSet.add(Number(msg.fromUserId));
                    this.emit(this.onlineUsersListeners, Array.from(this.onlineUserSet));
                } else if (msg.type === 'LEAVE' && msg.fromUserId != null) {
                    this.onlineUserSet.delete(Number(msg.fromUserId));
                    this.emit(this.onlineUsersListeners, Array.from(this.onlineUserSet));
                }
            } catch (e) {
                console.warn('Invalid WS message', evt.data);
            }
        };
        this.ws.onerror = (evt) => this.emit(this.errorListeners, evt);
        this.ws.onclose = (evt) => {
            this.stopHeartbeat();
            this.emit(this.closeListeners, evt);
            if (!this.manualClose) this.scheduleReconnect();
        };
    }

    disconnect() {
        console.log("disconnecting chat socket");
        this.manualClose = true;
        this.stopHeartbeat();
        if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        this.ws = null;
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({type: 'PING'}));
            }
        }, this.opts.heartbeatInterval);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(this.opts.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1), this.opts.maxReconnectDelay);
        this.reconnectTimer && clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }

    sendChat(content: string, toUserId?: number) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
        const payload: ChatMessage = {type: 'CHAT', content};
        if (toUserId) payload.toUserId = toUserId;
        this.ws.send(JSON.stringify(payload));
        return true;
    }

    // 新增：发送图片消息（content 为图片 URL）
    sendImage(imageUrl: string, toUserId?: number, meta?: { width?: number; height?: number }) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
        const payload: ChatMessage = { type: 'IMAGE', content: imageUrl };
        if (toUserId) payload.toUserId = toUserId;
        if (meta) {
            if (meta.width) (payload as any).width = meta.width;
            if (meta.height) (payload as any).height = meta.height;
        }
        this.ws.send(JSON.stringify(payload));
        return true;
    }

    async fetchHistory(): Promise<ChatMessage[]> {
        try {
            const body: any = await request.get('/chat/history', {
                params: { limit: this.opts.historyLimit }
            });
            if (body && typeof body === 'object' && 'data' in body) return body.data || [];
            return body || [];
        } catch (e) {
            console.warn('[chat] fetchHistory failed', e);
            return [];
        }
    }

    // 新增：从历史消息重建在线用户集合（取最后事件为 JOIN 的用户）
    rebuildOnlineFromHistory(history: ChatMessage[]) {
        const lastEvent: Record<number, string> = {};
        // 按时间排序，确保最后事件准确
        const sorted = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        for (const m of sorted) {
            if ((m.type === 'JOIN' || m.type === 'LEAVE') && m.fromUserId != null) {
                lastEvent[Number(m.fromUserId)] = m.type;
            }
        }
        this.onlineUserSet.clear();
        Object.entries(lastEvent).forEach(([uid, t]) => {
            if (t === 'JOIN') this.onlineUserSet.add(Number(uid));
        });
        // 触发监听
        this.emit(this.onlineUsersListeners, Array.from(this.onlineUserSet));
    }

}
