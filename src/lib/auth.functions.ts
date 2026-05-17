import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const createAccountSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  name: z.string().trim().max(120).optional().default(""),
});

export const createEmailAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => createAccountSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const fullName = data.name?.trim() || email.split("@")[0];

    const createUserPayload = {
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      password_check: false,
    };

    const { data: createdUser, error } = await supabaseAdmin.auth.admin.createUser(createUserPayload as never);

    if (error) {
      if (/already|exists|registered|taken/i.test(error.message)) {
        return { ok: true, alreadyExists: true };
      }

      throw new Error(error.message);
    }

    return {
      ok: true,
      alreadyExists: false,
      userId: createdUser.user?.id ?? null,
    };
  });