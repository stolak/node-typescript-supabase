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
