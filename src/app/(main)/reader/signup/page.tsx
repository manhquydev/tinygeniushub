import { ReaderSignupForm } from "@/components/reader/reader-signup-form";

type ReaderSignupPageProps = {
  searchParams?: Promise<{ next?: string | string[] }> | { next?: string | string[] };
};

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function ReaderSignupPage({ searchParams }: ReaderSignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <ReaderSignupForm nextPath={nextPath} />
    </div>
  );
}
