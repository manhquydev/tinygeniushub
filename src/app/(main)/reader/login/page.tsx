import { ReaderLoginForm } from "@/components/reader/reader-login-form";

type ReaderLoginPageProps = {
  searchParams?: Promise<{ next?: string | string[] }> | { next?: string | string[] };
};

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function ReaderLoginPage({ searchParams }: ReaderLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <ReaderLoginForm nextPath={nextPath} />
    </div>
  );
}
