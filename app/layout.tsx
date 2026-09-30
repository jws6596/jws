import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { V1ProgressPanel } from '@/components/dev/v1-progress-panel'
import { ProjectChatbot } from '@/components/site/project-chatbot'

export const metadata: Metadata = {
  title: '빈집지킴이 | 멀리 있어도, 늘 가까이',
  description:
    '빈집 주소를 입력하면 현지 점검 가능 여부를 확인할 수 있습니다. 검증된 현지 관리인이 대신 점검하고, AI가 정비 우선순위를 분석해드립니다.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1b4a6b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.OPENAI_API_KEY ? <ProjectChatbot /> : null}
        {process.env.NODE_ENV !== 'production' ? <V1ProgressPanel /> : null}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
