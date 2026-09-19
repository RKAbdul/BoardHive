import { getTranslations } from "next-intl/server"
import { CreateHiveForm } from "@/features/hives/components/create-hive-form"

export default async function NewHivePage() {
  const t = await getTranslations("hives.create")

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-6">
        <CreateHiveForm />
      </div>
    </div>
  )
}
