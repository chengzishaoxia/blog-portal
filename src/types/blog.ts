// 通用分页类型
export interface PageQuery {
    pageNum: number;
    pageSize: number;
}

export interface PageResult<T> {
    list: T;
    total: number;
}

// 标签
export interface BlogTagVO {
    id: number;
    name: string;
    sort?: number;
    status?: number;
    postCount?: number; // 关联博客数量
}

export interface BlogFriendLinkVO {
    id: number;
    name: string;
    url: string;
    avatar?: string;
    description?: string;
    sort?: number;
    status?: number;
    createTime?: string;
    updateTime?: string;
}

// 文章精简列表项
export interface BlogPostItem {
    id: number;
    title: string;
    summary?: string;
    coverImage?: string;
    viewCount?: number;
    createTime?: string;
    updateTime?: string;
    tags?: BlogTagVO[];
    pinned?: number; // 置顶 0-否 1-是 新增
    isRecommend?: number;
}

// 文章详情
export interface BlogPostDetail extends BlogPostItem {
    content: string;
}

export enum BlogPostStatus {
    DRAFT = 0,
    PUBLISHED = 1
}

export interface PostPageQuery extends PageQuery {
    keywords?: string;
    tagId?: number;
}

// 评论
export interface BlogCommentVO {
    id: number;
    postId: number;
    parentId: number;
    userId: number;
    nickname?: string;
    avatar?: string;
    content: string;
    likeCount?: number;
    status?: number;
    createTime?: string;
    children?: BlogCommentVO[]
}

export interface BlogRecentCommentVO {
    id: number;
    postId: number;
    postTitle?: string;
    nickname?: string;
    avatar?: string;
    content: string;
    createTime?: string;
}

export interface BlogCommentForm {
    id?: number;
    postId: number;
    parentId?: number;
    content: string;
}

export interface BlogMessageDanmakuVO {
    id: number;
    nickname: string;
    avatar?: string;
    content: string;
    createTime?: string;
}

export interface BlogMessageSubmitForm {
    nickname: string;
    content: string;
}

// 归档
export interface BlogArchivePost {
    id: number;
    title: string;
    createTime?: string; // yyyy-MM-dd HH:mm:ss
}

export interface BlogArchiveGroup {
    year: number; // 年
    month: number; // 1-12
    count: number; // 当月数量
    posts: BlogArchivePost[]; // 该月文章
}

// 轮播图
export interface BlogCarouselVO {
    id: number;
    fileId: number;
    fileUrl?: string;
    createTime?: string;
    updateTime?: string;
}

export interface BlogWeatherVO {
    province?: string;
    city?: string;
    location?: string;
    weather?: string;
    temperature?: string;
    highTemperature?: string;
    lowTemperature?: string;
    windDirection?: string;
    windScale?: string;
    humidity?: string;
    reportTime?: string;
}