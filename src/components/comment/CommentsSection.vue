<template>
  <section class="comments-wrapper" :id="idBase">
    <h3 class="c-title">评论 <span class="count" v-if="!loading">{{ flatCount }}</span></h3>

    <div v-if="loading" class="c-skeleton">
      <div class="sk-row" v-for="n in 4" :key="n">
        <div class="sk-avatar"/>
        <div class="sk-lines">
          <div class="sk-line short"></div>
          <div class="sk-line"></div>
          <div class="sk-line w40"></div>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- 发表根评论 -->
      <div class="new-box" v-if="auth.isAuthed()">
        <div class="avatar" :title="auth.profile?.nickname">
          <img v-if="auth.profile?.avatar" :src="auth.profile?.avatar" alt="avatar"/>
          <span v-else>{{ auth.profile?.nickname?.charAt(0) || '我' }}</span>
        </div>
        <div class="form-col">
          <textarea v-model="newContent" class="new-text"
                    :placeholder="replyTarget ? '回复 @'+replyTarget.nickname+'：' : '发表你的看法~'"
                    @keydown.ctrl.enter.prevent="submitComment"/>
          <div class="actions-row">
            <button class="submit-btn" :disabled="submitting || !newContent.trim()" @click="submitComment">
              {{ submitting ? '发送中...' : (replyTarget ? '回复' : '发表评论') }}
            </button>
            <button class="cancel-reply" v-if="replyTarget" @click="cancelReply">取消回复</button>
          </div>
        </div>
      </div>
      <div class="login-tip" v-else>请先登录后发表评论。</div>

      <!-- 评论列表 -->
      <div v-if="comments.length" class="tree">
        <CommentNode v-for="c in comments" :key="c.id" :node="c" :depth="0" @reply="setReplyTarget"
                     @updated="refreshAfterChild"/>
      </div>
      <div v-else class="empty">暂无评论，快来抢沙发 ~</div>
    </div>
  </section>
</template>
<script setup lang="ts">
import {ref, watch, computed} from 'vue';
import {CommentAPI} from '@/api/comment';
import type {BlogCommentVO, BlogCommentForm} from '@/types/blog';
import {useAuthStore} from '@/store/auth-store';
import CommentNode from './CommentNode.vue';

interface Props {
  postId: number | string
}

const props = defineProps<Props>();

const auth = useAuthStore();
const loading = ref(false);
const submitting = ref(false);
const comments = ref<BlogCommentVO[]>([]);
const newContent = ref('');
const replyTarget = ref<BlogCommentVO | null>(null);
const idBase = 'comments-section';

watch(() => props.postId, () => {
  loadComments();
  cancelReply();
}, {immediate: true});

const flatCount = computed(() => {
  let count = 0;
  const dfs = (arr: BlogCommentVO[]) => arr.forEach(c => {
    count++;
    if (c.children?.length) dfs(c.children);
  });
  dfs(comments.value);
  return count;
});

async function loadComments() {
  if (!props.postId) return;
  loading.value = true;
  try {
    comments.value = await CommentAPI.listByPost(Number(props.postId));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function setReplyTarget(node: BlogCommentVO) {
  replyTarget.value = node;
}

function cancelReply() {
  replyTarget.value = null;
  newContent.value = '';
}

async function submitComment() {
  if (!newContent.value.trim() || submitting.value) return;
  const form: BlogCommentForm = {
    postId: Number(props.postId),
    content: newContent.value.trim(),
    parentId: replyTarget.value?.id
  };
  submitting.value = true;
  try {
    await CommentAPI.create(form);
    newContent.value = '';
    await loadComments();
    cancelReply();
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
}

function refreshAfterChild() { /* 统计刷新 */
}
</script>
<style scoped>
.comments-wrapper {
  margin-top: 2.5rem;
}

.c-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.c-title .count {
  font-size: .75rem;
  background: rgba(0, 0, 0, .06);
  padding: .15rem .55rem;
  border-radius: 999px;
}

:global(.dark) .c-title .count {
  background: rgba(255, 255, 255, .15);
}

.new-box {
  display: flex;
  gap: .9rem;
  margin-bottom: 1.4rem;
}

.new-box .avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  overflow: hidden;
}

.new-box .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-col {
  flex: 1;
}

.new-text {
  width: 100%;
  min-height: 110px;
  border: 1px solid rgba(0, 0, 0, .1);
  border-radius: 12px;
  padding: .75rem .9rem;
  resize: vertical;
  font: inherit;
  line-height: 1.6;
  background: var(--card-bg);
}

:global(.dark) .new-text {
  background: #101317;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, .15);
}

.actions-row {
  margin-top: .6rem;
  display: flex;
  gap: .7rem;
}

.submit-btn, .cancel-reply {
  border: 0;
  padding: .55rem 1.1rem;
  font-weight: 600;
  letter-spacing: .5px;
  font-size: .75rem;
  border-radius: 9px;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
}

.submit-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.cancel-reply {
  background: rgba(0, 0, 0, .06);
}

:global(.dark) .cancel-reply {
  background: rgba(255, 255, 255, .15);
  color: #e5e7eb;
}

.empty, .login-tip {
  padding: 1.4rem 0;
  text-align: center;
  font-size: .8rem;
  color: rgba(0, 0, 0, .55);
}

:global(.dark) .empty, :global(.dark) .login-tip {
  color: rgba(255, 255, 255, .55);
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

/* Skeleton */
.c-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.sk-row {
  display: flex;
  gap: 1rem;
}

.sk-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb);
  animation: pulse 1.4s ease-in-out infinite;
}

:global(.dark) .sk-avatar {
  background: linear-gradient(90deg, #1f242e, #2a303b, #1f242e);
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .55rem;
  padding-top: .2rem;
}

.sk-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb);
  animation: pulse 1.4s ease-in-out infinite;
}

.sk-line.short {
  width: 65%;
}

.sk-line.w40 {
  width: 40%;
}

:global(.dark) .sk-line {
  background: linear-gradient(90deg, #1f242e, #2a303b, #1f242e);
}

@keyframes pulse {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
