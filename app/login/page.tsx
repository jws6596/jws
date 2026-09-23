import { PlaceholderPage } from "@/components/site/placeholder-page"

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="로그인"
      description="로그인 및 회원 인증 기능을 준비하고 있습니다."
      purpose="이 페이지는 서비스 이용을 위한 로그인을 제공합니다."
      nextHref="/verify-phone"
      nextLabel="휴대폰 본인인증으로 이동"
    />
  )
}
