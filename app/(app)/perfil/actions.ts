"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  display_name: z.string().trim().min(1, "Decinos cómo te llamás").max(40),
  initial: z
    .string()
    .trim()
    .min(1, "Inicial obligatoria")
    .max(2, "Máximo 2 caracteres"),
});

export type UpdateProfileState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const parsed = schema.safeParse({
    display_name: formData.get("display_name"),
    initial: (formData.get("initial") ?? "").toString().toUpperCase(),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      initial: parsed.data.initial,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
