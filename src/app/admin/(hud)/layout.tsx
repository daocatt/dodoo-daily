import AccountHUD from '@/components/AccountHUD'

export default function HudLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountHUD />
      {children}
    </>
  )
}
