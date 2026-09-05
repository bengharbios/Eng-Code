import { redirect } from "next/navigation";

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const phone = params.phone ? String(params.phone) : "";
  if (phone) {
    redirect(`/?view=student&phone=${encodeURIComponent(phone)}`);
  }
  redirect("/?view=student");
}
