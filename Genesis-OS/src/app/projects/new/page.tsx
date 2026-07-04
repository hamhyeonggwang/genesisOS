"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  return (
    <Suspense>
      <NewProjectForm />
    </Suspense>
  );
}

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [idea, setIdea] = useState(searchParams.get("idea") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, idea }),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error?.message ?? "프로젝트 생성에 실패했습니다.");
      return;
    }

    router.push(`/projects/${body.project.id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">새 프로젝트</h1>
        <p className="text-sm text-muted-foreground">
          아이디어를 한 문단으로 입력하면 Discover 세션이 시작됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            제품 이름
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: OTHUB"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="idea" className="text-sm font-medium">
            아이디어
          </label>
          <textarea
            id="idea"
            required
            rows={5}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="예: 작업치료사를 위한 교육 플랫폼을 만들고 싶다..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "생성 중..." : "시작"}
        </Button>
      </form>
    </main>
  );
}
