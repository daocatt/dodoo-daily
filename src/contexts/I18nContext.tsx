'use client'

import React, { createContext, useContext, useState } from 'react'

type Locale = 'en' | 'zh-CN'

type Dictionary = Record<Locale, Record<string, string>>

const dictionaries: Dictionary = {
    'en': {
        // Board
        'board.chatAndNotes': 'Chat & Notes',
        'board.chooseColor': 'Choose Color',
        'board.empty': 'No notes yet. Be the first to say hi!',
        'board.leaveNote': 'Leave a Note',
        'board.placeholder': 'Write your message...',
        'board.postBtn': 'POST NOTE',
        'board.posting': 'Posting...',
        'board.prompt': 'What\'s on your mind today?',
        'board.subtitle': 'Leave a message for the family!',
        'board.title': 'Family Board',

        // Business
        'buy.alreadyCollected': 'Already Collected',
        'buy.buyNow': 'Buy Now',
        'buy.collectionPrice': 'Collection Price',
        'buy.notFound': 'Artwork not found',
        'buy.supportCreator': 'Support our little creator by collecting this artwork! Your purchase translates to real rewards for them.',
        'buy.title': 'Support Art',

        // Button
        'button.add': 'Add',
        'button.apply': 'Apply',
        'button.cancel': 'Cancel',
        'button.complete': 'Complete',
        'button.create': 'Create',
        'button.delete': 'Delete',
        'button.edit': 'Edit',
        'button.save': 'Save',
        'button.submitting': 'Submitting...',

        // Checkout
        'checkout.confirmPayment': 'Confirm Payment',
        'checkout.markCollector': 'Leave your mark as a collector',
        'checkout.nameLabel': 'Alias / Name',
        'checkout.namePlaceholder': 'e.g. Grandma, Friend X',
        'checkout.paymentSuccess': 'Payment Success!',
        'checkout.phoneLabel': 'Phone (Optional)',
        'checkout.phonePlaceholder': 'Optional',
        'checkout.processing': 'Processing...',
        'checkout.purchaseFailed': 'Purchase failed!',
        'checkout.redirecting': 'Redirecting...',
        'checkout.simulatePayment': 'This simulates a payment flow.',
        'checkout.thankYou': 'Thank you for your support.',
        'checkout.title': 'Checkout',

        // Common
        'common.back': 'Back',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.date': 'Date',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.history': 'History',
        'common.loading': 'Loading...',
        'common.logo': 'Logo',
        'common.logout': 'Logout',
        'common.save': 'Save',

        // Emotions
        'emotions.angerQuestion': 'What is your anger level now?',
        'emotions.form.confirm': 'Confirm Record',
        'emotions.form.reasonLabel': 'Reason',
        'emotions.form.reasonPlaceholder': 'Write down your feelings...',
        'emotions.history': 'Emotion History',
        'emotions.noRecords': 'No records this week.',
        'emotions.penalty': 'Anger Penalty',
        'emotions.recordBtn': 'Record Emotion',
        'emotions.recordDesc': 'Log how you feel right now',
        'emotions.resolved': 'Resolved',
        'emotions.title': 'Emotion World',

        // Footer
        'footer.copyright': 'copyright @{year} by DoDoo Daily. All rights reserved.',

        // Gallery
        'gallery.album.create': 'Create Album',
        'gallery.album.nameLabel': 'Album Name',
        'gallery.album.namePlaceholder': 'e.g., My Summer Art',
        'gallery.album.required': 'Please enter album name',
        'gallery.artworksCount': '{count} artworks',
        'gallery.detail.back': 'Back to Gallery',
        'gallery.detail.empty': 'No artworks in this album yet',
        'gallery.detail.emptySub': 'Start uploading your first masterpiece!',
        'gallery.detail.exhibitionBadge': 'Exhibition',
        'gallery.detail.genPoster': 'Gen Poster',
        'gallery.detail.notFound': 'Album not found',
        'gallery.empty': 'Gallery is still empty',
        'gallery.form.albumLabel': 'Album',
        'gallery.form.fileLabel': 'Upload Artwork',
        'gallery.form.isPublicLabel': 'Publish to Exhibition',
        'gallery.form.noAlbumOption': 'No Album',
        'gallery.form.priceCoinsLabel': 'Price (Coins)',
        'gallery.form.priceRmbLabel': 'Price (RMB - Optional)',
        'gallery.form.selectAlbum': 'Select an album',
        'gallery.form.selectAlbumFallback': 'Loading albums...',
        'gallery.form.submit': 'Upload Art',
        'gallery.form.titleLabel': 'Title',
        'gallery.form.titlePlaceholder': 'e.g., Sunset Colors',
        'gallery.form.uploading': 'Uploading...',
        'gallery.newAlbum': 'New Album',
        'gallery.noAlbums': 'No albums yet',
        'gallery.noAlbumsSub': 'Create an album to organize your art',
        'gallery.upload': 'Upload New Work',
        'gallery.title': 'Art Gallery',
        'gallery.archives': 'Archives',
        'gallery.isPoster': 'Exhibition',
        'gallery.detail.collected': 'Collected',
        'gallery.photoLabel': 'Photo',

        // Hud
        'hud.coins': 'Coins',
        'hud.familyTree': 'Family Tree',
        'hud.goldStars': 'Task Gold Stars',
        'hud.logout': 'Logout',
        'hud.parentMode': 'Parent Mode',
        'hud.penalties': 'Anger Penalties',
        'hud.purpleStars': 'Art Purple Stars',

        // Journal
        'journal.copyright': '© DoDoo Daily Journal System',
        'journal.dailyPost': 'Daily Post',
        'journal.empty': 'It\'s empty here. Start your first journal!',
        'journal.entry.preciousMoment': 'Precious Moment',
        'journal.exploreMore': 'Explore More',
        'journal.loading': 'Opening the journal...',
        'journal.newPost': 'New Post',
        'journal.placeholder': 'What interesting happened today?',
        'journal.post': 'Post',
        'journal.shareMoment': 'Share Moment',
        'journal.title': 'Journal',

        // Login
        'login.back': 'Back',
        'login.child': 'Child',
        'login.clickToContinue': 'Click your avatar to continue',
        'login.dashboard': 'Dashboard',
        'login.enterNickname': 'Enter Nickname',
        'login.enterSystem': 'Enter System',
        'login.error.enterName': 'Please enter your name',
        'login.error.failedInit': 'Initialization failed',
        'login.error.invalidPin': 'Invalid PIN',
        'login.error.network': 'Network error',
        'login.error.userNotFound': 'User not found. Check your nickname.',
        'login.firstLaunchAvatar': 'Click to set avatar',
        'login.firstLaunchPlaceholder': 'Enter your name to start...',
        'login.loginButton': 'Login',
        'login.nextStep': 'Next Step',
        'login.nicknamePlaceholder': 'Your Nickname',
        'login.parent': 'Parent',
        'login.pinPlaceholder': 'PIN Code',
        'login.rememberMe': 'Remember for 30 days',
        'login.title': 'Welcome to DoDoo Daily!',

        // Menu
        'menu.emotions': 'Emotions',
        'menu.gallery': 'Gallery',
        'menu.journal': 'Journal',
        'menu.shop': 'Shop',
        'menu.tasks': 'Tasks',

        // Milestones
        'milestones.empty': 'No milestone records yet.',

        // Order
        'order.action.confirm': 'Confirm Delivery',
        'order.action.refund': 'Refund',
        'order.goShopping': 'Go Shopping',
        'order.loadingOrders': 'Loading orders...',
        'order.myOrders': 'My Orders',
        'order.noOrdersDesc': 'Items you buy from the shop will appear here!',
        'order.purchaseHistory': 'Purchase History',
        'order.remark.placeholder': 'Add a remark for this order...',
        'order.status.completed': 'Completed',
        'order.status.pending': 'Pending',
        'order.status.refunded': 'Refunded',

        // Orders Management
        'parent.orders.gallery': 'Exhibition Orders',
        'parent.orders.shop': 'Shop Rewards',
        'parent.orders.buyer': 'Buyer',
        'parent.orders.artwork': 'Artwork',
        'parent.orders.noGalleryOrders': 'No exhibition orders yet.',
        'parent.orders.contact': 'Contact Phone',

        // Parent
        'parent.adjustStats': 'Reward/Penalty',
        'parent.archived': 'Archived',
        'parent.assignTask': 'Assign Task',
        'parent.previewChanges': 'Preview Changes',
        'parent.result': 'Result',
        'parent.slugLabel': 'Public ID (URL Slug)',
        'parent.slugHint': 'User identifier for personal homepage, e.g., "lily-art"',
        'parent.viewPublicProfile': 'Visit Exhibition',

        // Poster
        'poster.description': 'Work Description',
        'poster.exhibition': '[Online Exhibition]',
        'poster.generating': 'Generating beautiful poster...',
        'poster.preview': 'Poster Preview',
        'poster.priceLabel': 'Collection Price:',
        'poster.ready': 'Poster generated!',
        'poster.regen': 'Regenerate',
        'poster.save': 'Save to Gallery',

        // Settings
        'settings.enterNewPin': 'Enter New PIN',
        'settings.errorNetwork': 'Network Error',
        'settings.nickname': 'Nickname',
        'settings.nicknameHint': 'Used for login when "Show All Avatars" is disabled (case insensitive)',
        'settings.nicknamePlaceholder': 'Your short nickname',
        'settings.nicknameSuccess': 'Nickname updated!',
        'settings.parentConsole': 'Parent Console',
        'settings.parentConsoleDesc': 'Manage family, rewards, and shop.',
        'settings.securityPin': 'Security PIN',
        'settings.securityPinDesc': 'Personal password for role switching and privacy.',
        'settings.title': 'Settings & Profile',
        'settings.updateFailed': 'Update failed',
        'settings.updatePin': 'Update PIN',
        'settings.saveNickname': 'Save Nickname',
        'settings.pinLengthError': 'PIN must be at least 4 digits',
        'settings.pinUpdateSuccess': 'PIN updated',
        'settings.pushNotifications': 'Push Notifications',
        'settings.pushNotificationsDesc': 'Receive updates about tasks and milestones when the app is closed.',
        'settings.pushSubscribed': 'Subscribed',
        'settings.pushUnsubscribed': 'Enable Notifications',
        'settings.pushBlocked': 'Notifications Blocked',

        // Shop
        'shop.title': 'Reward Shop',
        'shop.buyNow': 'Buy Now',
        'shop.buying': 'Buying...',
        'shop.coinsDeducted': '{amount} coins will be deducted',
        'shop.confirmBuy': 'Are you sure you want to buy?',
        'shop.confirmButton': 'Confirm!',
        'shop.form.descOptional': 'Description (Optional)',
        'shop.form.descPlaceholder': 'Describe your wish...',
        'shop.form.icon': 'Icon',
        'shop.form.submitWish': 'Submit Wish',
        'shop.form.wishName': 'Wish Name',
        'shop.form.wishPlaceholder': 'e.g., New Toy',
        'shop.item.active': 'Active',
        'shop.item.delete': 'Delete Reward',
        'shop.item.deleteConfirm': 'Confirm Delete',
        'shop.item.deleteDesc': 'Delete "{name}"? Purchased orders are not affected, images are kept.',
        'shop.item.deleteIrreversible': 'This action is irreversible.',
        'shop.item.inactive': 'Inactive',
        'shop.makeWish': 'Make a Wish',
        'shop.management.description': 'Description',
        'shop.management.photo': 'Photo',
        'shop.management.productDetails': 'Product Details',
        'shop.management.productName': 'Product Name',
        'shop.orders.myOrders': 'My Orders',
        'shop.wish.submitted': 'Wish submitted! Waiting for parent review.',
        'shop.wishes.addedToShop': 'Added to Shop',
        'shop.wishes.addToShop': 'Add to Shop',
        'shop.wishes.addToShopDesc': 'Add "{name}" to reward shop and set coin cost.',
        'shop.wishes.addToShopModal': 'Add to Shop',
        'shop.wishes.alreadyAdded': 'Already added to shop',
        'shop.wishes.coinCost': 'Coin Cost',
        'shop.wishes.confirm': 'Confirm',
        'shop.wishes.confirmAdd': 'Confirm Add',
        'shop.wishes.confirmed': 'Confirmed',
        'shop.wishes.myWishes': 'My Wishes',
        'shop.wishes.noWishes': 'No wishes yet.',
        'shop.wishes.pending': 'Pending',
        'shop.wishes.rejected': 'Rejected',
        'shop.wishes.title': 'Children\'s Wish List',

        // Public Profile
        'public.albums': 'Curated Albums',
        'public.artworks': 'Masterpieces',
        'public.collect': 'Collect This Piece',
        'public.hero.subtitle': 'Welcome to my creative collection',
        'public.title': '{name}\'s Art World',
        'public.viewExhibition': 'Enter Exhibition',
        'public.visitHome': 'Visit Homepage',
        'public.noArt': 'No public artworks yet.',
        'public.stats.pieces': 'Artworks',
        'public.stats.stars': 'Purple Stars',

        // Site
        'site.title': 'DoDoo Daily',

        // Stats
        'stats.deleteConfirm': 'Are you sure you want to delete this record?',
        'stats.earnings': 'Earnings',
        'stats.error.load': 'Failed to load stats',
        'stats.goBack': 'Back',
        'stats.growthHistory': 'Growth History',
        'stats.height': 'Height (cm)',
        'stats.history.balance': 'Balance',
        'stats.history.coins': 'Coins History',
        'stats.history.desc': 'Transaction log for {name}',
        'stats.history.empty': 'No transaction logs',
        'stats.history.page': 'Page {page} of {total}',
        'stats.history.purple': 'Purple Stars History',
        'stats.history.stars': 'Stars History',
        'stats.loggingFor': 'Logging for {name}',
        'stats.noData': 'No children data found',
        'stats.noDataDesc': 'Please make sure you have added a child first.',
        'stats.noHistory': 'No history records',
        'stats.noRecords': 'No {type} records yet',
        'stats.recordBtn': 'Record',
        'stats.saveRecord': 'Save Record',
        'stats.starsEarned': 'Stars Earned',
        'stats.subtitle': 'Family Statistics',
        'stats.tasksCompleted': 'Tasks Done Last Week',
        'stats.title': 'Growth & Stats',
        'stats.weight': 'Weight (kg)',
        'stats.weeklyProgress': 'Weekly Progress',
        'stats.newRecord': 'New Record',
        'stats.recentGrowth': 'Recent Growth',

        // System
        'system.closed': 'System Closed',
        'system.closedDesc': 'The system is currently undergoing maintenance or has been closed by the parent.',

        // Widget
        'widget.journal.empty': 'No entries today',
        'widget.journal.title': 'Journal',
        'widget.milestones.empty': 'No milestones',
        'widget.milestones.title': 'Milestones',
        'widget.notes.pinned': 'Pinned',
        'widget.notes.waiting': 'Waiting...',
        'widget.photo.empty': 'Album is empty',
        'widget.photo.latest': 'Latest Art',
        'widget.profile.explorer': 'Master Explorer',
        'widget.profile.growthLevel': 'Growth Level {level}',
        'widget.profile.height': 'Height',
        'widget.profile.weight': 'Weight',
        'widget.tasks.clear': 'Cleared!',
        'widget.tasks.title': 'Tasks',
        'widget.tasks.today': 'Today',

        // Wish
        'wish.loadingWishes': 'Loading wishes...',
        'wish.myWishes': 'My Wishes',
        'wish.noDescription': 'No description.',
        'wish.noWishes': 'No wishes yet',
        'wish.noWishesDesc': 'Want something? Make a wish to your parents!',
        'wish.requested': 'Requested at:',
        'wish.waitingForParents': 'Waiting for parents',
    },
    'zh-CN': {
        // Board
        'board.chatAndNotes': '聊天与笔记',
        'board.chooseColor': '选择颜色',
        'board.empty': '还没有留言。来打个招呼吧！',
        'board.leaveNote': '留个言',
        'board.placeholder': '写点什么...',
        'board.postBtn': '发布留言',
        'board.posting': '正在发布...',
        'board.prompt': '今天在想什么？',
        'board.subtitle': '给家人留个言吧！',
        'board.title': '家庭留言板',

        // Business
        'buy.alreadyCollected': '已被收藏',
        'buy.buyNow': '立即购买',
        'buy.collectionPrice': '收藏价格',
        'buy.notFound': '未找到作品',
        'buy.supportCreator': '收藏这件作品，支持我们的小创作者！您的购买将为他们带来真实的奖励。',
        'buy.title': '作品收藏',

        // Button
        'button.add': '添加',
        'button.apply': '应用',
        'button.cancel': '取消',
        'button.complete': '完成',
        'button.create': '创建',
        'button.delete': '删除',
        'button.edit': '编辑',
        'button.save': '保存',
        'button.submitting': '提交中...',

        // Checkout
        'checkout.confirmPayment': '确认支付',
        'checkout.markCollector': '留下您的名字，作为收藏者',
        'checkout.nameLabel': '您的称呼',
        'checkout.namePlaceholder': '例如：奶奶，朋友 X',
        'checkout.paymentSuccess': '支付成功！',
        'checkout.phoneLabel': '联系方式 (可选)',
        'checkout.phonePlaceholder': '可选',
        'checkout.processing': '正在处理...',
        'checkout.purchaseFailed': '购买失败！',
        'checkout.redirecting': '正在跳转...',
        'checkout.simulatePayment': '此操作仅模拟支付流程。',
        'checkout.thankYou': '感谢您的支持。',
        'checkout.title': '结账',

        // Common
        'common.back': '返回',
        'common.cancel': '取消',
        'common.confirm': '确认',
        'common.date': '日期',
        'common.delete': '删除',
        'common.edit': '编辑',
        'common.history': '历史记录',
        'common.loading': '正在加载...',
        'common.logo': '标志',
        'common.logout': '登出',
        'common.save': '保存',

        // Emotions
        'emotions.angerQuestion': '你现在的愤怒程度是？',
        'emotions.form.confirm': '确认记录',
        'emotions.form.reasonLabel': '原因',
        'emotions.form.reasonPlaceholder': '写下你的感受...',
        'emotions.history': '情感历史',
        'emotions.noRecords': '本周暂无记录',
        'emotions.penalty': '愤怒惩罚',
        'emotions.recordBtn': '记录情感',
        'emotions.recordDesc': '记录这一刻的心情',
        'emotions.resolved': '已解决',
        'emotions.title': '情感世界',

        // Footer
        'footer.copyright': '© {year} DoDoo Daily. 保留所有权利。',

        // Gallery
        'gallery.album.create': '创建画册',
        'gallery.album.nameLabel': '画册名称',
        'gallery.album.namePlaceholder': '例如：我的夏日画集',
        'gallery.album.required': '请输入画册名称',
        'gallery.artworksCount': '共 {count} 件作品',
        'gallery.detail.back': '返回画廊',
        'gallery.detail.empty': '这个画册里还没有作品',
        'gallery.detail.emptySub': '开始上传你的第一个杰作吧！',
        'gallery.detail.exhibitionBadge': '展览中',
        'gallery.detail.genPoster': '生成海报',
        'gallery.detail.notFound': '找不到画册',
        'gallery.empty': '画廊还是空的',
        'gallery.form.albumLabel': '所属画册',
        'gallery.form.fileLabel': '上传画作',
        'gallery.form.isPublicLabel': '发布到展览',
        'gallery.form.noAlbumOption': '不属于任何画册',
        'gallery.form.priceCoinsLabel': '金币价格',
        'gallery.form.priceRmbLabel': '人民币价格 (可选)',
        'gallery.form.selectAlbum': '选择一个画册',
        'gallery.form.selectAlbumFallback': '加载画册中...',
        'gallery.form.submit': '上传作品',
        'gallery.form.titleLabel': '作品名称',
        'gallery.form.titlePlaceholder': '例如：多彩的夕阳',
        'gallery.form.uploading': '正在上传...',
        'gallery.newAlbum': '新画册',
        'gallery.noAlbums': '暂无画册',
        'gallery.noAlbumsSub': '创建一个画册来整理你的作品',
        'gallery.upload': '上传新作品',
        'gallery.title': '艺术画廊',
        'gallery.archives': '存档画馆',
        'gallery.isPoster': '展览作品',
        'gallery.detail.collected': '已售出',
        'gallery.photoLabel': '作品图片',

        // Hud
        'hud.coins': '金币',
        'hud.familyTree': '家族树',
        'hud.goldStars': '任务金币星星',
        'hud.logout': '退出',
        'hud.parentMode': '家长模式',
        'hud.penalties': '愤怒惩罚',
        'hud.purpleStars': '艺术紫星',

        // Journal
        'journal.copyright': '© DoDoo Daily 日志系统',
        'journal.dailyPost': '日常记录',
        'journal.empty': '这里还是一片空白，开始记录第一篇日记吧！',
        'journal.entry.preciousMoment': '珍贵的时刻',
        'journal.exploreMore': '查看更多',
        'journal.loading': '正在翻开日志本...',
        'journal.newPost': '发布动态',
        'journal.placeholder': '今天发生了什么有趣的事？',
        'journal.post': '发布',
        'journal.shareMoment': '分享时刻',
        'journal.title': '日志',

        // Login
        'login.back': '返回',
        'login.child': '孩子',
        'login.clickToContinue': '点击头像继续',
        'login.dashboard': '工作台',
        'login.enterNickname': '输入昵称',
        'login.enterSystem': '进入系统',
        'login.error.enterName': '请输入你的名字',
        'login.error.failedInit': '初始化失败',
        'login.error.invalidPin': '无效的 PIN',
        'login.error.network': '网络错误',
        'login.error.userNotFound': '未找到用户，请检查昵称。',
        'login.firstLaunchAvatar': '点击设置头像',
        'login.firstLaunchPlaceholder': '输入你的名字开始...',
        'login.loginButton': '登录',
        'login.nextStep': '下一步',
        'login.nicknamePlaceholder': '你的昵称',
        'login.parent': '家长',
        'login.pinPlaceholder': 'PIN 码',
        'login.rememberMe': '记住 30 天',
        'login.title': '欢迎来到 DoDoo Daily！',

        // Menu
        'menu.emotions': '情绪',
        'menu.gallery': '画廊',
        'menu.journal': '日志',
        'menu.shop': '商店',
        'menu.tasks': '任务',

        // Milestones
        'milestones.empty': '暂无大事记记录。',

        // Order
        'order.action.confirm': '确认发货',
        'order.action.refund': '退款',
        'order.goShopping': '去逛逛',
        'order.loadingOrders': '正在加载订单...',
        'order.myOrders': '我的订单',
        'order.noOrdersDesc': '你在商店购买的商品会出现在这里！',
        'order.purchaseHistory': '购买记录',
        'order.remark.placeholder': '为此订单添加备注...',
        'order.status.completed': '已完成',
        'order.status.pending': '待处理',
        'order.status.refunded': '已退款',

        // 订单管理
        'parent.orders.gallery': '展览订单',
        'parent.orders.shop': '商店兑换',
        'parent.orders.buyer': '购买者',
        'parent.orders.artwork': '画作',
        'parent.orders.noGalleryOrders': '暂无展览订单。',
        'parent.orders.contact': '联系电话',

        // Parent
        'parent.adjustStats': '奖惩调整',
        'parent.archived': '已归档',
        'parent.assignTask': '分配任务',
        'parent.previewChanges': '预览变更',
        'parent.result': '结果',
        'parent.slugLabel': '公开ID (URL 别名)',
        'parent.slugHint': '个人主页的唯一标识符，例如 "lily-art"',
        'parent.viewPublicProfile': '访问个人展厅',

        // Poster
        'poster.description': '作品描述',
        'poster.exhibition': '【在线展厅】',
        'poster.generating': '正在生成精美海报...',
        'poster.preview': '海报预览',
        'poster.priceLabel': '收藏价：',
        'poster.ready': '海报已生成！',
        'poster.regen': '重新生成',
        'poster.save': '保存到相册',

        // Settings
        'settings.enterNewPin': '输入新密码',
        'settings.errorNetwork': '网络错误',
        'settings.nickname': '昵称',
        'settings.nicknameHint': '当“显示所有头像”被禁用时用于登录（不区分大小写）',
        'settings.nicknamePlaceholder': '你的简短昵称',
        'settings.nicknameSuccess': '昵称已更新！',
        'settings.parentConsole': '家长控制台',
        'settings.parentConsoleDesc': '管理家庭、奖励和商店。',
        'settings.securityPin': '安全密码',
        'settings.securityPinDesc': '用于角色切换和隐私的个人密码。',
        'settings.title': '设置与个人资料',
        'settings.updateFailed': '更新失败',
        'settings.updatePin': '更新密码',
        'settings.saveNickname': '保存昵称修改',
        'settings.pinLengthError': '密码长度至少为 4 位',
        'settings.pinUpdateSuccess': '密码已更新',
        'settings.pushNotifications': '推送通知',
        'settings.pushNotificationsDesc': '关闭应用时也能收到关于任务和大事记的更新。',
        'settings.pushSubscribed': '已开启',
        'settings.pushUnsubscribed': '开启推送通知',
        'settings.pushBlocked': '通知已被禁用',

        // Shop
        'shop.title': '积分商店',
        'shop.buyNow': '立即购买',
        'shop.buying': '购买中...',
        'shop.coinsDeducted': '将扣除 {amount} 金币',
        'shop.confirmBuy': '确定要购买吗？',
        'shop.confirmButton': '确认！',
        'shop.form.descOptional': '描述（可选）',
        'shop.form.descPlaceholder': '详细描述一下你的愿望吧...',
        'shop.form.icon': '图标',
        'shop.form.submitWish': '提交愿望',
        'shop.form.wishName': '愿望名称',
        'shop.form.wishPlaceholder': '例如：新玩具',
        'shop.item.active': '上架',
        'shop.item.delete': '删除奖励',
        'shop.item.deleteConfirm': '确认删除',
        'shop.item.deleteDesc': '删除「{name}」？已购买的订单不受影响，图片文件保留。',
        'shop.item.deleteIrreversible': '此操作不可撤销。',
        'shop.item.inactive': '下架',
        'shop.makeWish': '许个愿望',
        'shop.management.description': '商品描述',
        'shop.management.photo': '照片',
        'shop.management.productDetails': '商品详情',
        'shop.management.productName': '商品名称',
        'shop.orders.myOrders': '我的订单',
        'shop.wish.submitted': '愿望已提交！等待家长审核。',
        'shop.wishes.addedToShop': '已加入商店',
        'shop.wishes.addToShop': '加入商店',
        'shop.wishes.addToShopDesc': '将「{name}」加入奖励商店，并设置所需金币数。',
        'shop.wishes.addToShopModal': '加入商店',
        'shop.wishes.alreadyAdded': '已加入商店',
        'shop.wishes.coinCost': '所需金币',
        'shop.wishes.confirm': '确认',
        'shop.wishes.confirmAdd': '确认加入',
        'shop.wishes.confirmed': '已确认',
        'shop.wishes.myWishes': '我的愿望',
        'shop.wishes.noWishes': '暂无愿望。',
        'shop.wishes.pending': '待处理',
        'shop.wishes.rejected': '已拒绝',
        'shop.wishes.title': '孩子的愿望申请',

        // Public Profile
        'public.albums': '精选画册',
        'public.artworks': '所有杰作',
        'public.collect': '收藏这件作品',
        'public.hero.subtitle': '欢迎来到我的创意世界',
        'public.title': '{name} 的艺术中心',
        'public.viewExhibition': '进入展厅',
        'public.visitHome': '访问个人主页',
        'public.noArt': '暂无公开作品',
        'public.stats.pieces': '总作品数',
        'public.stats.stars': '艺术紫星',

        // Site
        'site.title': 'DoDoo Daily',

        // Stats
        'stats.deleteConfirm': '确定要删除这条记录吗？',
        'stats.earnings': '收益',
        'stats.error.load': '加载统计信息失败',
        'stats.goBack': '返回',
        'stats.growthHistory': '成长历史',
        'stats.height': '身高 (cm)',
        'stats.history.balance': '余额',
        'stats.history.coins': '金币历史',
        'stats.history.desc': '{name} 的交易日志',
        'stats.history.empty': '暂无交易日志',
        'stats.history.page': '第 {page} 页，共 {total} 页',
        'stats.history.purple': '紫星历史',
        'stats.history.stars': '星星历史',
        'stats.loggingFor': '正在为 {name} 记录',
        'stats.noData': '未发现孩子数据',
        'stats.noDataDesc': '请确保您已先添加了孩子。',
        'stats.noHistory': '暂无历史记录',
        'stats.noRecords': '暂无 {type} 记录',
        'stats.recordBtn': '记录',
        'stats.saveRecord': '保存记录',
        'stats.starsEarned': '获得的星星',
        'stats.subtitle': '家庭统计',
        'stats.tasksCompleted': '上周完成的任务',
        'stats.title': '成长与统计',
        'stats.weight': '体重 (kg)',
        'stats.weeklyProgress': '每周进展',
        'stats.newRecord': '新记录',
        'stats.recentGrowth': '近期成长',

        // System
        'system.closed': '系统关闭',
        'system.closedDesc': '系统当前正在维护，或者已被家长关闭。',

        // Widget
        'widget.journal.empty': '今日暂无记录',
        'widget.journal.title': '日志',
        'widget.milestones.empty': '暂无大事记',
        'widget.milestones.title': '大事记',
        'widget.notes.pinned': '已置顶',
        'widget.notes.waiting': '等待中...',
        'widget.photo.empty': '画册空空如也',
        'widget.photo.latest': '最新作品',
        'widget.profile.explorer': '小小探险家',
        'widget.profile.growthLevel': '成长等级 {level}',
        'widget.profile.height': '身高',
        'widget.profile.weight': '体重',
        'widget.tasks.clear': '已清空！',
        'widget.tasks.title': '任务',
        'widget.tasks.today': '今日',

        // Wish
        'wish.loadingWishes': '正在加载愿望...',
        'wish.myWishes': '我的愿望',
        'wish.noDescription': '暂无描述。',
        'wish.noWishes': '暂无愿望',
        'wish.noWishesDesc': '有什么想要的商品吗？向家长许个愿吧！',
        'wish.requested': '申请时间：',
        'wish.waitingForParents': '等待家长处理',
    }
}

interface I18nContextProps {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dodoo-locale') as Locale
            if (saved && ['en', 'zh-CN'].includes(saved)) {
                return saved
            }
            const browserLang = navigator.language
            if (browserLang && browserLang.toLowerCase().includes('zh')) {
                return 'zh-CN'
            }
        }
        return 'en'
    })

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale)
        localStorage.setItem('dodoo-locale', newLocale)
    }

    const t = (key: string, params?: Record<string, string>) => {
        let text = dictionaries[locale][key]
        
        // Fallback to English if missing in Chinese
        if (!text && locale === 'zh-CN') {
            text = dictionaries['en'][key]
        }
        
        // Fallback to Chinese if missing in English
        if (!text && locale === 'en') {
            text = dictionaries['zh-CN'][key]
        }

        if (!text) {
            console.warn(`[i18n] Missing translation for key: ${key}`)
            text = key
        }

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v)
            })
        }
        return text
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}
