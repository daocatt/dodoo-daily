'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'en' | 'zh-CN'

type Dictionary = {
    [key in Locale]: {
        [key: string]: string
    }
}

const dictionaries: Dictionary = {
    'en': {
        'site.title': 'DoDoo Daily',
        'footer.copyright': 'copyright @{year} by DoDoo Daily. All rights reserved.',
        'menu.tasks': 'Tasks',
        'menu.emotions': 'Emotions',
        'menu.gallery': 'Gallery',
        'menu.journal': 'Journal',
        'menu.shop': 'Shop',
        'hud.coins': 'Coins',
        'hud.goldStars': 'Task Gold Stars',
        'hud.purpleStars': 'Art Purple Stars',
        'hud.penalties': 'Anger Penalties',
        'hud.parentMode': 'Parent Mode',
        'hud.logout': 'Logout',
        'login.title': 'Who is playing?',
        'login.parent': 'Parent',
        'login.child': 'Child',
        'login.back': 'Back',
        'login.pinPlaceholder': 'PIN / Password',
        'login.clickToContinue': 'Click login to continue',
        'login.rememberMe': 'Remember me',
        'login.loginButton': 'Login',
        'login.error.userNotFound': 'User not found',
        'login.error.invalidPin': 'Invalid PIN',
        'login.error.network': 'Network error',
        'parent.title': 'Parent Dashboard',
        'parent.rewards': 'Manual Rewards',
        'parent.rewardsDesc': 'Add or remove Stars manually for the child.',
        'parent.penalties': 'Emotion Penalties',
        'parent.penaltiesDesc': 'Record anger outbursts or manage existing penalties.',
        'parent.family': 'Family Accounts',
        'parent.familyDesc': 'Update child info or change parent PIN.',
        'parent.settings': 'App Settings',
        'parent.settingsDesc': 'Configure app-wide parameters and features.',
        'button.manage': 'Manage',
        'button.record': 'Record',
        'button.settings': 'Settings',
        'tasks.title': 'Tasks',
        'tasks.newTask': 'New Task',
        'tasks.noTasks': 'No tasks found',
        'tasks.noTasksSub': 'Click "New Task" to set a goal.',
        'tasks.dailyLoop': 'Daily Loop',
        'tasks.createGoal': 'Create Goal',
        'tasks.form.nameLabel': 'Goal / Task Name',
        'tasks.form.namePlaceholder': 'Read a book',
        'tasks.form.rewardLabel': 'Reward Stars',
        'tasks.form.recurringLabel': 'Daily Recurring',
        'emotions.title': 'Emotions',
        'emotions.recordBtn': 'Record It Now',
        'emotions.angerQuestion': 'Anger Outburst?',
        'emotions.recordDesc': 'Recording an outburst gives 1 Anger Penalty shape.',
        'emotions.history': 'History',
        'emotions.noRecords': 'No records. Great job keeping emotions balanced!',
        'emotions.resolved': 'Resolved',
        'emotions.penalty': 'Penalty',
        'emotions.form.reasonLabel': 'Optional Reason / Notes',
        'emotions.form.reasonPlaceholder': 'e.g. Got mad about dinner...',
        'emotions.form.confirm': 'Confirm',
        'gallery.title': 'Gallery',
        'gallery.upload': 'Upload / Photo',
        'gallery.newAlbum': 'New Album',
        'gallery.noAlbums': 'No Albums Yet',
        'gallery.noAlbumsSub': 'Click "New Album" to start your gallery!',
        'gallery.empty': 'Empty',
        'gallery.artworksCount': '{count} Artworks',
        'gallery.detail.empty': 'Empty Album',
        'gallery.detail.emptySub': 'Upload some art to this album!',
        'gallery.detail.notFound': 'Album Not Found',
        'gallery.detail.back': 'Back to Gallery',
        'gallery.detail.collected': 'Collected',
        'gallery.detail.genPoster': 'Generate Poster',
        'gallery.form.titleLabel': 'Title',
        'gallery.form.titlePlaceholder': 'e.g. Summer Sky',
        'gallery.form.priceRmbLabel': 'Price RMB',
        'gallery.form.priceCoinsLabel': 'Price Coins',
        'gallery.form.albumLabel': 'Select Album',
        'gallery.form.noAlbumOption': 'No Album',
        'gallery.form.fileLabel': 'Select File',
        'gallery.form.submit': 'Submit / Publish',
        'poster.exhibition': 'Art Exhibition',
        'poster.description': 'A piece of creative imagination from our little artist. Support their journey by collecting this artwork.',
        'poster.priceLabel': 'Collection Price',
        'poster.generating': 'Generating Masterpiece...',
        'poster.preview': 'Preview & Generate Poster',
        'poster.ready': 'Your Poster is Ready!',
        'poster.save': 'Save to Device',
        'poster.regen': 'Generate Again',
        'shop.title': 'Wish Shop',
        'shop.newWish': 'New Wish',
        'shop.buyWithCoins': 'Buy with Coins',
        'shop.buySuccess': 'Bought {name}! Check your HUD!',
        'shop.buyError': 'Purchase failed',
        'shop.form.addTitle': 'Add New Wish',
        'shop.form.nameLabel': 'Wish Name / Item',
        'shop.form.costLabel': 'Cost (Coins)',
        'shop.form.emojiLabel': 'Emoji Icon',
        'common.loading': 'Loading...',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'common.confirm': 'Confirm'
    },
    'zh-CN': {
        'site.title': 'DoDoo Daily',
        'footer.copyright': '© {year} DoDoo Daily. 保留所有权利。',
        'menu.tasks': '任务',
        'menu.emotions': '情绪',
        'menu.gallery': '画廊',
        'menu.journal': '日志',
        'menu.shop': '商店',
        'hud.coins': '金币',
        'hud.goldStars': '任务金星',
        'hud.purpleStars': '艺术紫星',
        'hud.penalties': '情绪惩罚',
        'hud.parentMode': '家长模式',
        'hud.logout': '登出',
        'login.title': '谁在玩？',
        'login.parent': '家长',
        'login.child': '儿童',
        'login.back': '返回',
        'login.pinPlaceholder': '密码 / PIN码',
        'login.clickToContinue': '点击登录继续',
        'login.rememberMe': '记住我',
        'login.loginButton': '登录',
        'login.error.userNotFound': '用户不存在',
        'login.error.invalidPin': '密码错误',
        'login.error.network': '网络连接失败',
        'parent.title': '家长后台',
        'parent.rewards': '手动奖惩',
        'parent.rewardsDesc': '手动为孩子添加或减少星星。',
        'parent.penalties': '情绪记录',
        'parent.penaltiesDesc': '记录孩子的发脾气情况或管理惩罚。',
        'parent.family': '家庭账号',
        'parent.familyDesc': '更新孩子信息或更改家长密码。',
        'parent.settings': '应用设置',
        'parent.settingsDesc': '配置应用的全局参数和功能。',
        'button.manage': '管理',
        'button.record': '记录',
        'button.settings': '设置',
        'tasks.title': '任务',
        'tasks.newTask': '新建任务',
        'tasks.noTasks': '暂无任务',
        'tasks.noTasksSub': '点击右上角添加新目标吧。',
        'tasks.dailyLoop': '每日循环',
        'tasks.createGoal': '创建目标',
        'tasks.form.nameLabel': '目标/任务名称',
        'tasks.form.namePlaceholder': '例如：读书30分钟',
        'tasks.form.rewardLabel': '金星奖励',
        'tasks.form.recurringLabel': '每日重复',
        'emotions.title': '情绪',
        'emotions.recordBtn': '记录惩罚',
        'emotions.angerQuestion': '又发脾气了?',
        'emotions.recordDesc': '记录一次情绪失控将计入 1 个图形惩罚。',
        'emotions.history': '历史记录',
        'emotions.noRecords': '没有记录，情绪管理得非常棒！',
        'emotions.resolved': '已化解',
        'emotions.penalty': '惩罚中',
        'emotions.form.reasonLabel': '备注/原因',
        'emotions.form.reasonPlaceholder': '例如：因为不能看电视生气',
        'emotions.form.confirm': '确认记录',
        'gallery.title': '画廊',
        'gallery.upload': '上传/拍照',
        'gallery.newAlbum': '新建画册',
        'gallery.noAlbums': '暂无画册',
        'gallery.noAlbumsSub': '点击新建画册开始您的个人展览！',
        'gallery.empty': '暂无内容',
        'gallery.artworksCount': '{count} 幅作品',
        'gallery.detail.empty': '画册为空',
        'gallery.detail.emptySub': '快去上传些作品吧！',
        'gallery.detail.notFound': '未找到该画册',
        'gallery.detail.back': '返回画廊',
        'gallery.detail.collected': '已收藏',
        'gallery.detail.genPoster': '生成海报',
        'gallery.form.titleLabel': '画作名称',
        'gallery.form.titlePlaceholder': '例如：夏日的天空',
        'gallery.form.priceRmbLabel': '人民币售价',
        'gallery.form.priceCoinsLabel': '金币售价',
        'gallery.form.albumLabel': '选择画册',
        'gallery.form.noAlbumOption': '不分配画册',
        'gallery.form.fileLabel': '选择图片',
        'gallery.form.submit': '发布作品',
        'poster.exhibition': '艺术展览',
        'poster.description': '来自我们小艺术家的创意想象。通过收藏这幅作品来支持他们的旅程。',
        'poster.priceLabel': '收藏价格',
        'poster.generating': '正在生成杰作...',
        'poster.preview': '预览并生成海报',
        'poster.ready': '您的海报已准备就绪！',
        'poster.save': '保存图片',
        'poster.regen': '重新生成',
        'shop.title': '愿望商店',
        'shop.newWish': '添加愿望',
        'shop.buyWithCoins': '金币兑换',
        'shop.buySuccess': '成功兑换 {name}！快看顶部状态栏！',
        'shop.buyError': '兑换失败',
        'shop.form.addTitle': '添加新愿望',
        'shop.form.nameLabel': '愿望名称',
        'shop.form.costLabel': '花费金币',
        'shop.form.emojiLabel': '图标',
        'common.loading': '加载中...',
        'common.cancel': '取消',
        'common.back': '返回',
        'common.confirm': '确认'
    }
}

interface I18nContextProps {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en')

    useEffect(() => {
        const saved = localStorage.getItem('dodoo-locale') as Locale
        if (saved && ['en', 'zh-CN'].includes(saved)) {
            setLocale(saved)
        } else {
            const browserLang = navigator.language
            if (browserLang.toLowerCase().includes('zh')) {
                setLocale('zh-CN')
            }
        }
    }, [])

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale)
        localStorage.setItem('dodoo-locale', newLocale)
    }

    const t = (key: string, params?: Record<string, string>) => {
        let text = dictionaries[locale][key] || key
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
