import { supabase } from "../supabaseClient";

export interface UserMenu {
  caption: string;
  route: string;
}

export interface UserPrivilege {
  description: string;
  status: string;
}

export interface UserRolesData {
  menus: UserMenu[];
  privileges: UserPrivilege[];
}

export interface CreateUserParams {
  email: string;
  password?: string;
  name?: string;
  role_code?: string;
  email_confirm?: boolean;
}

/**
 * Fetches user roles, menus, and privileges for a given user ID
 * @param userId - The user ID to fetch roles for
 * @returns Object containing menus and privileges arrays, or null if error occurs
 */
export async function getUserRolesAndPermissions(
  userId: string
): Promise<{ data: UserRolesData | null; error: string | null }> {
  try {
    const { data: userRolesData, error: userRolesError } = await supabase
      .from("user_roles")
      .select(
        `
        user_id,
        role_code,
        role:roles(
          code,
          name,
          status,
          privileges:role_privileges(
            id,
            description,
            status,
            created_at,
            updated_at
          ),
          menus:role_menus(
            id,
            menu_id,
            menu:menus(
              id,
              route,
              caption
            )
          )
        )
      `
      )
      .eq("user_id", String(userId));

    if (userRolesError) {
      return { data: null, error: userRolesError.message };
    }

    let menus: UserMenu[] = [];
    let privileges: UserPrivilege[] = [];

    if (userRolesData?.length > 0) {
      const role = Array.isArray(userRolesData[0].role)
        ? userRolesData[0].role[0]
        : userRolesData[0].role;

      menus =
        role?.menus?.map((item: any) => ({
          caption: item.menu?.caption || "",
          route: item.menu?.route || "",
        })) || [];

      privileges =
        role?.privileges?.map((item: any) => ({
          description: item.description || "",
          status: item.status || "",
        })) || [];
    }

    return {
      data: { menus, privileges },
      error: null,
    };
  } catch (err) {
    console.error("Error fetching user roles and permissions:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Creates a new user in Supabase Auth
 * @param params - User creation parameters
 * @returns Object containing the created user data or error
 */
export async function createUser(
  params: CreateUserParams
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { email, password, name, role_code, email_confirm = true } = params;

    if (!email) {
      return { data: null, error: "Email is required" };
    }

    const { data: newUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password: password || "123456",
        user_metadata: {
          ...(name && { name }),
          ...(role_code && { roles: [role_code] }),
        },
        app_metadata: {
          ...(role_code && { roles: [role_code] }),
        },
        email_confirm,
      });

    if (createUserError) {
      return { data: null, error: createUserError.message };
    }
    await supabase
      .from("user_roles")
      .upsert([{ user_id: newUser.user?.id, role_code: role_code }], {
        onConflict: "user_id",
      });
    return {
      data: newUser.user,
      error: null,
    };
  } catch (err) {
    console.error("Error creating user:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
