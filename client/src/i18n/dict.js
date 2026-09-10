/* ============================================================
   中英文文案字典
   - 只放「界面文案」；用户自己写的内容（回忆标题/描述、评论、留言、倒计时主题名、
     GitHub 提交信息）一律不在这里，也永远不翻译。
   - 模板变量写成 {name} / {count}，由 i18n/index.js 的 t() 做插值。
   - 中文里的全角标点（：、「」、，、…、～、＋）只出现在中文值里，
     英文值用自己的标点，不要照搬。
   - _one / _other 后缀是英文复数用的（见 tCount），中文只有单数形式，
     所以中文只写基础键即可。
   ============================================================ */

export const dict = {
  zh: {
    common: {
      cancel: '取消',
      save: '保存',
      saveChanges: '保存修改',
      saving: '保存中…',
      edit: '编辑',
      delete: '删除',
      reply: '回复',
      send: '发送',
      close: '关闭',
      loading: '加载中…',
      anonymous: '匿名',
      ta: 'ta',
    },

    header: {
      nav: '回忆',
      logout: '退出',
      addMemory: '添加回忆',
      switchToEnglish: '切换到英文',
      switchToChinese: '切换到中文',
    },

    app: {
      loadFailed: '加载失败：{message}',
      deleteConfirm: '确定删除「{title}」这条回忆吗？删除后无法恢复。',
      sessionExpired: '登录状态已失效，请重新登录',
      deleteFailed: '删除失败，请稍后再试',
    },

    tabs: {
      countdown: '倒计时',
      memories: '回忆',
      messages: '留言板',
    },

    footer: {
      tech:
        '本页面使用 Claude + DeepSeek vibe coding 而成 · 前端挂载于腾讯 EdgeOne Pages · 数据库由 Aiven 支持 · 后端挂载于 Render · 上传的图片存储于 Filebase',
      thanks: '本网站由 Will Wang 开发',
    },

    login: {
      subtitle: '回忆',
      username: '用户名',
      password: '密码',
      submit: '登录',
      submitting: '登录中…',
      badCredentials: '密码不对哦',
      networkError: '网络异常，请稍后再试',
      demoLabel: '旁观者体验账号',
      demoHint: '点击一键填入',
    },

    memory: {
      add: '添加回忆',
      edit: '编辑回忆',
    },

    memoryForm: {
      type: '类型',
      title: '标题',
      date: '日期',
      location: '地点',
      description: '描述',
      image: '图片',
      titlePlaceholder: '例如：第一次去迪士尼',
      locationPlaceholder: '例如：上海迪士尼',
      descriptionPlaceholder: '这段回忆的故事…',
      imageUrlPlaceholder: '或直接粘贴图片链接（留空则不带图）',
      uploading: '上传中…',
      imagePreviewAlt: '图片预览',
      removeImage: '移除图片',
      chooseImage: '选择图片',
      uploadHint: '选择本地图片直传到 Filebase（不经过 Render）',
      errTitleRequired: '标题不能为空',
      errDateRequired: '日期不能为空',
      errSessionExpired: '登录已过期，请重新登录',
      errSaveFailed: '保存失败，请稍后再试',
    },

    memoryCard: {
      editTitle: '编辑这条回忆',
      deleteTitle: '删除这条回忆',
      postedAt: '发布于',
    },

    comment: {
      placeholder: '写下你的评论…',
      submit: '评论',
      replyPlaceholder: '回复 {name}…',
      confirmDelete: '确定删除这条评论吗？其下回复会一并删除。',
      confirmReplyDelete: '确定删除这条回复吗？',
      errCreate: '评论失败',
      errReply: '回复失败',
      errSave: '保存失败',
      errDelete: '删除失败',
    },

    countdown: {
      title: '倒计时',
      addTitle: '添加倒计时',
      editTitle: '编辑倒计时',
      emptyViewer: '还没有倒计时',
      empty: '还没有倒计时，点 ＋ 添加一个',
      daysUnit: '天',
      future: '距离「{name}」还有',
      today: '「{name}」就是今天',
      past: '距离「{name}」已经',
      nameLabel: '主题名',
      namePlaceholder: '如：纪念日 / 生日',
      dateLabel: '目标日期',
      errNameRequired: '主题名不能为空',
      errDateRequired: '请选择目标日期',
      confirmDelete: '确定删除「{name}」这个倒计时吗？',
      errLoad: '加载失败',
      errSave: '保存失败',
      errDelete: '删除失败',
    },

    board: {
      title: '留言板',
      placeholder: '写下想说的话…',
      submit: '留言',
      empty: '还没有留言，来留个言吧～',
      replyPlaceholder: '回复 {name}…',
      confirmDelete: '确定删除这条留言吗？其下回复会一并删除。',
      confirmReplyDelete: '确定删除这条回复吗？',
      errLoad: '加载失败',
      errCreate: '留言失败',
      errReply: '回复失败',
      errSave: '保存失败',
      errDelete: '删除失败',
    },

    welcome: {
      title: '欢迎回来',
      titleWithName: '欢迎回来，{name}',
      recentUpdates: '最近更新',
      empty: '暂时没有更新记录',
      errLoad: '暂时无法获取更新信息',
      gotIt: '知道了',
    },

    theme: {
      toDark: '切换到夜间模式',
      toLight: '切换到日间模式',
    },

    // 回忆类型的英文标签。键就是数据库里存的中文值，只用于显示，不参与提交。
    memoryType: {},

    time: {
      justNow: '刚刚',
      minutesAgo: '{count} 分钟前',
      hoursAgo: '{count} 小时前',
      daysAgo: '{count} 天前',
    },

    error: {
      network: '网络异常',
      invalidToken: 'token 无效',
      uploadDirectFailed: '直传失败 HTTP {status}',
      uploadFailed: '图片上传失败',
    },
  },

  en: {
    common: {
      cancel: 'Cancel',
      save: 'Save',
      saveChanges: 'Save changes',
      saving: 'Saving…',
      edit: 'Edit',
      delete: 'Delete',
      reply: 'Reply',
      send: 'Send',
      close: 'Close',
      loading: 'Loading…',
      anonymous: 'Anonymous',
      ta: 'them',
    },

    header: {
      // 品牌名 Memories 之外的中文副名，英文下用站点原来的英文名，避免与主标题重复
      nav: 'Moments',
      logout: 'Log out',
      addMemory: 'Add a memory',
      switchToEnglish: 'Switch to English',
      switchToChinese: 'Switch to Chinese',
    },

    app: {
      loadFailed: 'Failed to load: {message}',
      deleteConfirm: 'Delete the memory “{title}”? This can’t be undone.',
      sessionExpired: 'Your session has expired. Please log in again.',
      deleteFailed: 'Delete failed. Please try again.',
    },

    tabs: {
      countdown: 'Countdowns',
      memories: 'Memories',
      messages: 'Messages',
    },

    footer: {
      tech:
        'Built with Claude + DeepSeek via vibe coding · Frontend on Tencent EdgeOne Pages · Database by Aiven · Backend on Render · Images stored on Filebase',
      thanks: 'Developed by Will Wang',
    },

    login: {
      subtitle: 'Moments',
      username: 'Username',
      password: 'Password',
      submit: 'Log in',
      submitting: 'Logging in…',
      badCredentials: 'Wrong password',
      networkError: 'Network error. Please try again.',
      demoLabel: 'Demo viewer account',
      demoHint: 'Click to fill in',
    },

    memory: {
      add: 'Add a memory',
      edit: 'Edit memory',
    },

    memoryForm: {
      type: 'Type',
      title: 'Title',
      date: 'Date',
      location: 'Location',
      description: 'Description',
      image: 'Image',
      titlePlaceholder: 'e.g. First trip to Disneyland',
      locationPlaceholder: 'e.g. Shanghai Disneyland',
      descriptionPlaceholder: 'The story behind this memory…',
      imageUrlPlaceholder: 'Or paste an image URL (leave blank for none)',
      uploading: 'Uploading…',
      imagePreviewAlt: 'Image preview',
      removeImage: 'Remove image',
      chooseImage: 'Choose image',
      uploadHint: 'Uploads straight to Filebase (bypasses Render)',
      errTitleRequired: 'Title is required',
      errDateRequired: 'Date is required',
      errSessionExpired: 'Your session has expired. Please log in again.',
      errSaveFailed: 'Save failed. Please try again.',
    },

    memoryCard: {
      editTitle: 'Edit this memory',
      deleteTitle: 'Delete this memory',
      postedAt: 'Posted',
    },

    comment: {
      placeholder: 'Write a comment…',
      submit: 'Comment',
      replyPlaceholder: 'Reply to {name}…',
      confirmDelete: 'Delete this comment? Its replies will be deleted too.',
      confirmReplyDelete: 'Delete this reply?',
      errCreate: 'Failed to post comment',
      errReply: 'Failed to post reply',
      errSave: 'Save failed',
      errDelete: 'Delete failed',
    },

    countdown: {
      title: 'Countdowns',
      addTitle: 'Add a countdown',
      editTitle: 'Edit countdown',
      emptyViewer: 'No countdowns yet',
      empty: 'No countdowns yet — tap + to add one',
      daysUnit_one: 'day',
      daysUnit_other: 'days',
      future: 'Until “{name}”',
      today: '“{name}” is today',
      past: 'Since “{name}”',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Anniversary / Birthday',
      dateLabel: 'Target date',
      errNameRequired: 'Name is required',
      errDateRequired: 'Please pick a target date',
      confirmDelete: 'Delete the countdown “{name}”?',
      errLoad: 'Failed to load',
      errSave: 'Save failed',
      errDelete: 'Delete failed',
    },

    board: {
      title: 'Messages',
      placeholder: 'Say something…',
      submit: 'Post',
      empty: 'No messages yet — be the first',
      replyPlaceholder: 'Reply to {name}…',
      confirmDelete: 'Delete this message? Its replies will be deleted too.',
      confirmReplyDelete: 'Delete this reply?',
      errLoad: 'Failed to load',
      errCreate: 'Failed to post message',
      errReply: 'Failed to post reply',
      errSave: 'Save failed',
      errDelete: 'Delete failed',
    },

    welcome: {
      title: 'Welcome back',
      titleWithName: 'Welcome back, {name}',
      recentUpdates: 'Recent updates',
      empty: 'No updates yet',
      errLoad: 'Couldn’t load updates',
      gotIt: 'Got it',
    },

    theme: {
      toDark: 'Switch to dark mode',
      toLight: 'Switch to light mode',
    },

    /* 回忆类型的显示标签：键是数据库里存的中文值。
       只影响显示，下拉选中后提交的仍然是中文值。 */
    memoryType: {
      学习: 'Study',
      旅行: 'Travel',
      电影: 'Movie',
      演唱会: 'Concert',
      演出: 'Show',
      礼物: 'Gift',
      综艺: 'Variety',
      其他: 'Other',
      // 历史遗留的英文类型（旧 mock 数据），本身就是英文，保持原样
      date: 'Date',
      travel: 'Travel',
      gift: 'Gift',
      movie: 'Movie',
      variety: 'Variety',
      other: 'Other',
    },

    time: {
      justNow: 'just now',
      minutesAgo_one: '{count} minute ago',
      minutesAgo_other: '{count} minutes ago',
      hoursAgo_one: '{count} hour ago',
      hoursAgo_other: '{count} hours ago',
      daysAgo_one: '{count} day ago',
      daysAgo_other: '{count} days ago',
    },

    error: {
      network: 'Network error',
      invalidToken: 'Invalid token',
      uploadDirectFailed: 'Direct upload failed (HTTP {status})',
      uploadFailed: 'Image upload failed',
    },
  },
};
