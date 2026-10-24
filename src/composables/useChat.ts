import {ref, computed} from 'vue';
import { useEventListener } from '@vueuse/core';
import type {ChatMessage, ChatSocketOptions} from '@/services/chatSocket';
import {ChatSocketService} from '@/services/chatSocket';

const serviceRef = ref<ChatSocketService | null>(null);
const messages = ref<ChatMessage[]>([]);
const onlineUsers = ref<number[]>([]);
const connected = ref(false);
const connecting = ref(false);
const historyLoading = ref(false); // 新增：历史消息初始化加载状态

export function useChat() {
    function init(options: ChatSocketOptions = {}) {
        if (serviceRef.value) return;
        const chatSocketService = new ChatSocketService(options); // options 不再含 token
        serviceRef.value = chatSocketService;

        chatSocketService.onOpen(() => {
            connected.value = true;
            connecting.value = false;
            historyLoading.value = true;
            chatSocketService.fetchHistory().then(h => {
                messages.value = h;
                // 重建在线用户集合（无需 HTTP 接口）
                chatSocketService.rebuildOnlineFromHistory(h);
            }).finally(() => {
                historyLoading.value = false;
            });
        });
        chatSocketService.onClose(() => {
            connected.value = false;
        });
        chatSocketService.onMessage(msg => {
            messages.value.push(msg);
        });
        chatSocketService.onOnlineUsers(users => {
            onlineUsers.value = users;
        });
        chatSocketService.connect();

        useEventListener(window, 'beforeunload', () => {
            disconnect();
        });
    }

    function send(content: string, toUserId?: number) {
        if (!content.trim()) return false;
        return serviceRef.value?.sendChat(content, toUserId) ?? false;
    }

    function sendImage(url: string, toUserId?: number, meta?: { width?: number; height?: number }) {
        if (!url) return false;
        return serviceRef.value?.sendImage(url, toUserId, meta) ?? false;
    }

    function disconnect() {
        serviceRef.value?.disconnect();
        serviceRef.value = null;
    }

    const sortedMessages = computed(() => [...messages.value].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
    return {
        init,
        send,
        sendImage,
        disconnect,
        messages: sortedMessages,
        rawMessages: messages,
        onlineUsers,
        connected,
        connecting,
        historyLoading // 导出
    };
}
