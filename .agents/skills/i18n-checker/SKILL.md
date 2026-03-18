---
name: i18n-checker
description: Enforce complete translation coverage without hardcoded texts
---

# i18n Checker

## Overview
This skill must be applied when generating new UI components or modifying existing ones. Your primary goal is to **NEVER** use hardcoded Chinese or English text inside React components that are visible to the user. All user-facing text MUST go through the `I18nContext`.

## Rules

1. **NO Hardcoded UI Strings:** Do not write things like `<div>加载中...</div>` or `<h1>System Settings</h1>`.
2. **Always Use `t()` Function:** Use the `useI18n()` hook. For example:
   ```tsx
   const { t } = useI18n()
   return <h1>{t('module.title')}</h1>
   ```
3. **Always Update `I18nContext.tsx`:** If the translation key does not exist yet, you MUST add it to BOTH the `en` and `zh-CN` dictionary objects in `src/contexts/I18nContext.tsx`. Do not just add the key to one language.
4. **Deep Check Existing Hardcoded Strings:** When refactoring a file, proactively hunt for strings like `placeholder="搜索..."` and replace them with `placeholder={t('some.key')}`.
5. **No Placeholders in the Code:** Make sure you don't leave things like `TODO: Add translation`. Add the translation right away.

Violation of these rules will result in an immediate failure of the UI task.
