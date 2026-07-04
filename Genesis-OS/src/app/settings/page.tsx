import Link from "next/link";
import { getProviderConfig } from "@/engine/provider";

export default function SettingsPage() {
  const config = getProviderConfig();

  return (
    <main className="mx-auto max-w-xl space-y-6 p-8">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← 포트폴리오
        </Link>
        <h1 className="text-xl font-bold tracking-tight">설정</h1>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">AI Provider</h2>
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Provider</dt>
          <dd className="font-mono">{config.provider}</dd>
          <dt className="text-muted-foreground">Model</dt>
          <dd className="font-mono">{config.model}</dd>
        </dl>
        <p className="text-xs text-muted-foreground">
          Provider·모델 변경은 서버 환경변수(<code>GENESIS_AI_PROVIDER</code>,{" "}
          <code>GENESIS_AI_MODEL</code>)로 설정합니다. API 키는{" "}
          <code>.env.local</code>의 <code>ANTHROPIC_API_KEY</code>에 저장되며 이
          화면에는 표시되지 않습니다.
        </p>
      </section>
    </main>
  );
}
