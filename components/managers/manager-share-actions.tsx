"use client"

import { useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"

type Props = { title: string; text: string; href: string }

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) throw new Error("COPY_FAILED")
}

export function ManagerShareActions({ title, text, href }: Props) {
  const [notice, setNotice] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const getShareUrl = () => new URL(href, window.location.origin).toString()

  async function copySummary() {
    if (isSharing) return
    setIsSharing(true)
    try {
      await copyToClipboard(`${text}\n${getShareUrl()}`)
      setNotice("관리인 정보와 링크를 복사했어요.")
    } catch {
      setNotice("복사하지 못했어요. 브라우저 권한을 확인한 뒤 다시 시도해주세요.")
    } finally {
      setIsSharing(false)
    }
  }

  async function share() {
    if (isSharing) return
    setIsSharing(true)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: getShareUrl() })
        setNotice("공유를 완료했어요.")
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setNotice("공유하지 못했어요. 링크 복사를 이용해주세요.")
      } finally {
        setIsSharing(false)
      }
      return
    }

    try {
      await copyToClipboard(`${text}\n${getShareUrl()}`)
      setNotice("관리인 정보와 링크를 복사했어요.")
    } catch {
      setNotice("복사하지 못했어요. 브라우저 권한을 확인한 뒤 다시 시도해주세요.")
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="mt-4 border-t border-status-success/20 pt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void share()} disabled={isSharing} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"><Share2 className="size-4" />{isSharing ? "공유 준비 중" : "공유하기"}</button>
        <button type="button" onClick={() => void copySummary()} disabled={isSharing} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"><Copy className="size-4" />요약·링크 복사</button>
      </div>
      {notice ? <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-status-success" role="status" aria-live="polite"><Check className="size-4" />{notice}</p> : null}
    </div>
  )
}
