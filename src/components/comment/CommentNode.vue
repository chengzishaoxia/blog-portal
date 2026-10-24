<template>
  <div :class="['c-item', depth ? 'child' : 'root']">
    <div class="head">
      <span :class="['avatar', node.avatar ? 'has-img' : '']" :title="node.nickname || ('#' + node.userId)">
        <img v-if="node.avatar && !imgErr" :src="node.avatar" :alt="node.nickname || ''" @error="imgErr=true"/>
        <template v-else>{{ (node.nickname || '').charAt(0).toUpperCase() || 'U' }}</template>
      </span>
      <span class="nick">{{ node.nickname || ('用户' + node.userId) }}</span>
      <span class="time">{{ formatTime(node.createTime) }}</span>
    </div>
    <div v-if="editing" class="edit-box">
      <textarea v-model="editContent" class="edit-text"/>
      <div class="edit-actions">
        <button class="save-btn" :disabled="saving || !editContent.trim()" @click="saveEdit">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button class="cancel-edit-btn" @click="cancelEdit">取消</button>
      </div>
    </div>
    <div v-else class="body">{{ node.content }}</div>
    <div class="actions">
      <button class="reply-btn" @click="$emit('reply', node)">回复</button>
      <button v-if="isOwner && !editing" class="edit-btn" @click="startEdit">编辑</button>
      <button v-if="isOwner && !editing" class="del-btn" @click="deleteComment">删除</button>
    </div>
    <div v-if="node.children && node.children.length" class="children">
      <CommentNode v-for="child in node.children" :key="child.id" :node="child" :depth="depth+1"
                   @reply="$emit('reply', $event)" @updated="$emit('updated')"/>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import type {BlogCommentVO, BlogCommentForm} from '@/types/blog';
import {useAuthStore} from '@/store/auth-store';
import {CommentAPI} from '@/api/comment';

interface Props {
  node: BlogCommentVO;
  depth: number
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'reply', node: BlogCommentVO): void; (e: 'updated'): void }>();

const auth = useAuthStore();
const editing = ref(false);
const editContent = ref(props.node.content);
const saving = ref(false);
const imgErr = ref(false);
const isOwner = computed(() => !!auth.profile?.userId && auth.profile.userId === props.node.userId);

function startEdit() {
  editing.value = true;
  editContent.value = props.node.content;
}

function cancelEdit() {
  editing.value = false;
  editContent.value = props.node.content;
}

function formatTime(t?: string) {
  return t ? t.replace('T', ' ').slice(0, 19) : '';
}

async function saveEdit() {
  if (!editContent.value.trim()) return;
  saving.value = true;
  try {
    const form: BlogCommentForm = {
      id: props.node.id,
      postId: props.node.postId,
      parentId: props.node.parentId || undefined,
      content: editContent.value.trim()
    };
    await CommentAPI.update(props.node.id, form);
    props.node.content = editContent.value.trim();
    editing.value = false;
    emit('updated');
  } finally {
    saving.value = false;
  }
}

async function deleteComment() {
  if (!confirm('确定删除该评论？')) return;
  try {
    await CommentAPI.delete(props.node.id);
    props.node.content = '[已删除]';
    props.node.children = [];
    emit('updated');
  } catch (e) {
    console.error(e);
  }
}
</script>
<style scoped>
.c-item {
  position: relative;
}

.c-item.root {
  padding: .9rem 1rem;
  border: 1px solid rgba(0, 0, 0, .06);
  border-radius: 14px;
  background: var(--card-bg);
}

:global(.dark) .c-item.root {
  background: #101317;
  border-color: rgba(255, 255, 255, .12);
}

.c-item.child {
  margin-top: 1rem;
  margin-left: 2.6rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(0, 0, 0, .08);
}

:global(.dark) .c-item.child {
  border-color: rgba(255, 255, 255, .18);
}

.head {
  display: flex;
  align-items: center;
  gap: .55rem;
  font-size: .75rem;
  margin-bottom: .35rem;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 50%;
  overflow: hidden;
  font-size: .8rem;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nick {
  font-weight: 600;
  font-size: .7rem;
  color: #374151;
}

:global(.dark) .nick {
  color: #e5e7eb;
}

.time {
  opacity: .55;
  font-size: .65rem;
}

.body {
  font-size: .8rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.edit-box {
  margin: .4rem 0 .3rem;
}

.edit-text {
  width: 100%;
  min-height: 90px;
  padding: .6rem .7rem;
  border: 1px solid rgba(0, 0, 0, .15);
  border-radius: 10px;
  resize: vertical;
  font: inherit;
  line-height: 1.5;
  background: var(--card-bg);
}

:global(.dark) .edit-text {
  background: #101317;
  border-color: rgba(255, 255, 255, .15);
  color: #e5e7eb;
}

.edit-actions {
  margin-top: .45rem;
  display: flex;
  gap: .6rem;
}

.save-btn, .cancel-edit-btn {
  border: 0;
  padding: .45rem .85rem;
  font-size: .65rem;
  font-weight: 600;
  letter-spacing: .5px;
  border-radius: 8px;
  cursor: pointer;
}

.save-btn {
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
}

.save-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.cancel-edit-btn {
  background: rgba(0, 0, 0, .08);
}

:global(.dark) .cancel-edit-btn {
  background: rgba(255, 255, 255, .12);
  color: #e5e7eb;
}

.actions {
  margin-top: .55rem;
  display: flex;
  gap: .9rem;
}

.reply-btn, .edit-btn, .del-btn {
  background: transparent;
  border: 0;
  font-size: .65rem;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: .5px;
  padding: 0;
}

.reply-btn {
  color: #6366f1;
}

.edit-btn {
  color: #6366f1;
}

.del-btn {
  color: #dc2626;
}

.reply-btn:hover, .edit-btn:hover, .del-btn:hover {
  text-decoration: underline;
}

.children {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}
</style>
